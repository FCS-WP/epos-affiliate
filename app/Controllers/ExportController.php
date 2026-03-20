<?php

namespace EposAffiliate\Controllers;

defined( 'ABSPATH' ) || exit;

use EposAffiliate\Models\Commission;
use EposAffiliate\Models\OrderAttribution;
use WP_REST_Request;
use WP_REST_Response;

class ExportController {

    /**
     * Export commissions as CSV.
     */
    public static function commissions( WP_REST_Request $request ) {
        $args = [];
        if ( $request->get_param( 'status' ) ) $args['status'] = $request->get_param( 'status' );
        if ( $request->get_param( 'type' ) )   $args['type']   = $request->get_param( 'type' );

        $rows = Commission::all( $args );

        $csv = "ID,BD Name,Reseller,Type,Order #,Amount (RM),Status,Period,Created,Paid At\n";
        foreach ( $rows as $row ) {
            $csv .= sprintf(
                "%d,%s,%s,%s,%s,%.2f,%s,%s,%s,%s\n",
                $row->id,
                self::escape_csv( $row->bd_name ?? '' ),
                self::escape_csv( $row->reseller_name ?? '' ),
                $row->type,
                $row->reference_id ?? '',
                (float) $row->amount,
                $row->status,
                $row->period_month ?? '',
                $row->created_at,
                $row->paid_at ?? ''
            );
        }

        $response = new WP_REST_Response( $csv, 200 );
        $response->header( 'Content-Type', 'text/csv' );
        $response->header( 'Content-Disposition', 'attachment; filename="commissions.csv"' );
        return $response;
    }

    /**
     * Export order attributions as CSV.
     */
    public static function attributions( WP_REST_Request $request ) {
        $args = [];
        if ( $request->get_param( 'reseller_id' ) ) $args['reseller_id'] = $request->get_param( 'reseller_id' );
        if ( $request->get_param( 'bd_id' ) )        $args['bd_id']        = $request->get_param( 'bd_id' );
        if ( $request->get_param( 'date_from' ) )    $args['date_from']    = $request->get_param( 'date_from' );
        if ( $request->get_param( 'date_to' ) )      $args['date_to']      = $request->get_param( 'date_to' );

        $rows = OrderAttribution::all( $args );

        $csv = "ID,Order ID,BD ID,Reseller ID,Tracking Code,Order Value (RM),Attributed At\n";
        foreach ( $rows as $row ) {
            $csv .= sprintf(
                "%d,%d,%d,%d,%s,%.2f,%s\n",
                $row->id,
                $row->order_id,
                $row->bd_id,
                $row->reseller_id,
                $row->tracking_code,
                (float) $row->order_value,
                $row->attributed_at
            );
        }

        $response = new WP_REST_Response( $csv, 200 );
        $response->header( 'Content-Type', 'text/csv' );
        $response->header( 'Content-Disposition', 'attachment; filename="attributions.csv"' );
        return $response;
    }

    /**
     * Escape a value for safe CSV output.
     */
    private static function escape_csv( $value ) {
        if ( strpos( $value, ',' ) !== false || strpos( $value, '"' ) !== false ) {
            return '"' . str_replace( '"', '""', $value ) . '"';
        }
        return $value;
    }
}
