<?php

namespace EposAffiliate\Controllers;

defined( 'ABSPATH' ) || exit;

use EposAffiliate\Models\SerialNumber;
use EposAffiliate\Models\OrderAttribution;
use EposAffiliate\Services\Logger;
use WP_REST_Request;
use WP_REST_Response;

class SerialNumberController {

    /**
     * GET /serial-numbers — list all with filters.
     */
    public static function index( WP_REST_Request $request ) {
        $args = [];

        if ( $request->get_param( 'search' ) )      $args['search']      = $request->get_param( 'search' );
        if ( $request->get_param( 'status' ) )       $args['status']      = $request->get_param( 'status' );
        if ( $request->get_param( 'order_id' ) )     $args['order_id']    = $request->get_param( 'order_id' );
        if ( $request->get_param( 'bd_id' ) )        $args['bd_id']       = $request->get_param( 'bd_id' );
        if ( $request->get_param( 'reseller_id' ) )  $args['reseller_id'] = $request->get_param( 'reseller_id' );
        if ( $request->get_param( 'date_from' ) )    $args['date_from']   = $request->get_param( 'date_from' );
        if ( $request->get_param( 'date_to' ) )      $args['date_to']     = $request->get_param( 'date_to' );

        return new WP_REST_Response( SerialNumber::all( $args ), 200 );
    }

    /**
     * GET /serial-numbers/order/{order_id} — SNs for a specific order + order info.
     */
    public static function order_serials( WP_REST_Request $request ) {
        $order_id = absint( $request->get_param( 'order_id' ) );
        $order    = wc_get_order( $order_id );

        if ( ! $order ) {
            return new WP_REST_Response( [ 'message' => 'Order not found.' ], 404 );
        }

        $serials       = SerialNumber::find_by_order( $order_id );
        $assigned_count = count( $serials );

        // Calculate total item quantity.
        $total_qty = 0;
        foreach ( $order->get_items() as $item ) {
            $total_qty += $item->get_quantity();
        }

        // Get attribution info.
        $attribution = OrderAttribution::find_by_order( $order_id );

        return new WP_REST_Response( [
            'order_id'        => $order_id,
            'order_status'    => $order->get_status(),
            'order_total'     => $order->get_total(),
            'total_qty'       => $total_qty,
            'assigned_count'  => $assigned_count,
            'remaining'       => max( 0, $total_qty - $assigned_count ),
            'bd_name'         => $attribution ? self::get_bd_name( $attribution->bd_id ) : null,
            'reseller_name'   => $attribution ? self::get_reseller_name( $attribution->reseller_id ) : null,
            'bd_id'           => $attribution->bd_id ?? null,
            'reseller_id'     => $attribution->reseller_id ?? null,
            'serial_numbers'  => $serials,
        ], 200 );
    }

    /**
     * POST /serial-numbers — assign a serial number to an order.
     */
    public static function store( WP_REST_Request $request ) {
        $order_id      = absint( $request->get_param( 'order_id' ) );
        $serial_number = trim( sanitize_text_field( $request->get_param( 'serial_number' ) ) );

        if ( ! $order_id || ! $serial_number ) {
            return new WP_REST_Response( [ 'message' => 'Order ID and serial number are required.' ], 400 );
        }

        // 1. Check order exists and status is processing.
        $order = wc_get_order( $order_id );
        if ( ! $order ) {
            return new WP_REST_Response( [ 'message' => 'Order not found.' ], 404 );
        }

        if ( $order->get_status() !== 'processing' ) {
            return new WP_REST_Response( [
                'message' => 'Serial numbers can only be assigned to orders with "processing" status. Current status: ' . $order->get_status(),
            ], 400 );
        }

        // 2. Check uniqueness.
        if ( SerialNumber::find_by_serial( $serial_number ) ) {
            return new WP_REST_Response( [ 'message' => 'Serial number "' . $serial_number . '" is already assigned to another order.' ], 400 );
        }

        // 3. Check unit count.
        $total_qty      = 0;
        foreach ( $order->get_items() as $item ) {
            $total_qty += $item->get_quantity();
        }
        $assigned_count = SerialNumber::count_by_order( $order_id );

        if ( $assigned_count >= $total_qty ) {
            return new WP_REST_Response( [
                'message' => "All $total_qty unit(s) already have serial numbers assigned.",
            ], 400 );
        }

        // 4. Get attribution data.
        $attribution = OrderAttribution::find_by_order( $order_id );

        $sn_id = SerialNumber::create( [
            'order_id'      => $order_id,
            'bd_id'         => $attribution->bd_id ?? null,
            'reseller_id'   => $attribution->reseller_id ?? null,
            'serial_number' => $serial_number,
            'product_id'    => null,
            'source'        => 'manual',
        ] );

        if ( ! $sn_id ) {
            return new WP_REST_Response( [ 'message' => 'Failed to assign serial number.' ], 500 );
        }

        // Add WC order note.
        $order->add_order_note(
            sprintf( 'Serial number "%s" assigned (SN #%d) by %s.', $serial_number, $sn_id, wp_get_current_user()->display_name )
        );

        Logger::info( "SN '{$serial_number}' assigned to order #{$order_id} (SN ID: {$sn_id})", 'SerialNumber' );

        return new WP_REST_Response( SerialNumber::find( $sn_id ), 201 );
    }

    /**
     * POST /serial-numbers/bulk — bulk assign serial numbers.
     */
    public static function bulk_store( WP_REST_Request $request ) {
        $items = $request->get_param( 'items' );

        if ( ! is_array( $items ) || empty( $items ) ) {
            return new WP_REST_Response( [ 'message' => 'Items array is required.' ], 400 );
        }

        $results  = [];
        $errors   = [];

        foreach ( $items as $idx => $item ) {
            $order_id      = absint( $item['order_id'] ?? 0 );
            $serial_number = trim( sanitize_text_field( $item['serial_number'] ?? '' ) );

            if ( ! $order_id || ! $serial_number ) {
                $errors[] = "Item $idx: Order ID and serial number are required.";
                continue;
            }

            $order = wc_get_order( $order_id );
            if ( ! $order || $order->get_status() !== 'processing' ) {
                $errors[] = "Item $idx: Order #$order_id not found or not in processing status.";
                continue;
            }

            if ( SerialNumber::find_by_serial( $serial_number ) ) {
                $errors[] = "Item $idx: Serial number '$serial_number' already exists.";
                continue;
            }

            $attribution = OrderAttribution::find_by_order( $order_id );

            $sn_id = SerialNumber::create( [
                'order_id'      => $order_id,
                'bd_id'         => $attribution->bd_id ?? null,
                'reseller_id'   => $attribution->reseller_id ?? null,
                'serial_number' => $serial_number,
                'source'        => $item['source'] ?? 'api',
            ] );

            if ( $sn_id ) {
                $results[] = [ 'id' => $sn_id, 'order_id' => $order_id, 'serial_number' => $serial_number ];
                $order->add_order_note( sprintf( 'Serial number "%s" assigned via bulk/API.', $serial_number ) );
            } else {
                $errors[] = "Item $idx: Failed to create record.";
            }
        }

        Logger::info( sprintf( 'Bulk SN assignment: %d success, %d errors', count( $results ), count( $errors ) ), 'SerialNumber' );

        return new WP_REST_Response( [
            'created' => $results,
            'errors'  => $errors,
        ], count( $results ) > 0 ? 201 : 400 );
    }

    /**
     * GET /serial-numbers/check/{serial_number} — check if SN exists.
     */
    public static function check( WP_REST_Request $request ) {
        $serial = sanitize_text_field( $request->get_param( 'serial_number' ) );
        $exists = SerialNumber::find_by_serial( $serial );

        return new WP_REST_Response( [
            'exists'   => ! empty( $exists ),
            'order_id' => $exists->order_id ?? null,
        ], 200 );
    }

    /**
     * DELETE /serial-numbers/{id} — remove a serial number.
     */
    public static function destroy( WP_REST_Request $request ) {
        $id = absint( $request->get_param( 'id' ) );
        $sn = SerialNumber::find( $id );

        if ( ! $sn ) {
            return new WP_REST_Response( [ 'message' => 'Serial number not found.' ], 404 );
        }

        // Add order note before deletion.
        $order = wc_get_order( $sn->order_id );
        if ( $order ) {
            $order->add_order_note(
                sprintf( 'Serial number "%s" removed by %s.', $sn->serial_number, wp_get_current_user()->display_name )
            );
        }

        SerialNumber::delete( $id );

        Logger::info( "SN '{$sn->serial_number}' removed from order #{$sn->order_id}", 'SerialNumber' );

        return new WP_REST_Response( [ 'message' => 'Serial number removed.' ], 200 );
    }

    /**
     * Helper: get BD name.
     */
    private static function get_bd_name( $bd_id ) {
        $bd = \EposAffiliate\Models\BD::find( $bd_id );
        return $bd ? $bd->name : null;
    }

    /**
     * Helper: get Reseller name.
     */
    private static function get_reseller_name( $reseller_id ) {
        $reseller = \EposAffiliate\Models\Reseller::find( $reseller_id );
        return $reseller ? $reseller->name : null;
    }
}
