<?php

namespace EposAffiliate\Controllers;

defined( 'ABSPATH' ) || exit;

use EposAffiliate\Models\Commission;
use EposAffiliate\Models\OrderAttribution;
use WP_REST_Request;

class ExportController {

    /**
     * Export commissions as CSV.
     */
    public static function commissions( WP_REST_Request $request ) {
        $args = [];
        if ( $request->get_param( 'status' ) ) $args['status'] = $request->get_param( 'status' );
        if ( $request->get_param( 'type' ) )   $args['type']   = $request->get_param( 'type' );

        $rows = Commission::all( $args );

        header( 'Content-Type: text/csv; charset=utf-8' );
        header( 'Content-Disposition: attachment; filename="commissions.csv"' );

        $output = fopen( 'php://output', 'w' );
        fputcsv( $output, [ 'ID', 'BD Name', 'Reseller', 'Type', 'Order #', 'Amount', 'Status', 'Period', 'Created', 'Paid At' ] );

        foreach ( $rows as $row ) {
            fputcsv( $output, [
                $row->id,
                $row->bd_name ?? '',
                $row->reseller_name ?? '',
                $row->type,
                $row->reference_id ?? '',
                number_format( (float) $row->amount, 2, '.', '' ),
                $row->status,
                $row->period_month ?? '',
                $row->created_at,
                $row->paid_at ?? '',
            ] );
        }

        fclose( $output );
        exit;
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

        header( 'Content-Type: text/csv; charset=utf-8' );
        header( 'Content-Disposition: attachment; filename="attributions.csv"' );

        $output = fopen( 'php://output', 'w' );
        fputcsv( $output, [ 'ID', 'Order ID', 'BD ID', 'Reseller ID', 'Tracking Code', 'Order Value', 'Attributed At' ] );

        foreach ( $rows as $row ) {
            fputcsv( $output, [
                $row->id,
                $row->order_id,
                $row->bd_id,
                $row->reseller_id,
                $row->tracking_code,
                number_format( (float) $row->order_value, 2, '.', '' ),
                $row->attributed_at,
            ] );
        }

        fclose( $output );
        exit;
    }
}
