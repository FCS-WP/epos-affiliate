<?php

namespace EposAffiliate\Setup;

defined( 'ABSPATH' ) || exit;

use EposAffiliate\Models\SerialNumber;
use EposAffiliate\Services\Logger;

/**
 * Adds a Serial Numbers meta box to the WooCommerce order edit page.
 */
class OrderMetaBox {

    public static function init() {
        add_action( 'add_meta_boxes', [ self::class, 'register_meta_box' ] );
        add_action( 'wp_ajax_epos_add_serial_number', [ self::class, 'ajax_add_serial' ] );
        add_action( 'wp_ajax_epos_remove_serial_number', [ self::class, 'ajax_remove_serial' ] );
        add_action( 'admin_footer', [ self::class, 'inline_script' ] );
    }

    /**
     * Register the meta box on WC order screens.
     */
    public static function register_meta_box() {
        $screen = self::get_order_screen();
        if ( ! $screen ) {
            return;
        }

        add_meta_box(
            'epos-serial-numbers',
            __( 'Serial Numbers', 'epos-affiliate' ),
            [ self::class, 'render' ],
            $screen,
            'side',
            'default'
        );
    }

    /**
     * Get the correct screen ID for WC orders (supports HPOS and legacy).
     */
    private static function get_order_screen() {
        // HPOS (High-Performance Order Storage).
        if ( class_exists( '\Automattic\WooCommerce\Internal\DataStores\Orders\CustomOrdersTableController' ) ) {
            $controller = wc_get_container()->get( \Automattic\WooCommerce\Internal\DataStores\Orders\CustomOrdersTableController::class );
            if ( $controller && $controller->custom_orders_table_usage_is_enabled() ) {
                return 'woocommerce_page_wc-orders';
            }
        }

        return 'shop_order';
    }

    /**
     * Render the meta box content.
     */
    public static function render( $post_or_order ) {
        // Get order ID (supports both HPOS and legacy).
        if ( $post_or_order instanceof \WC_Order ) {
            $order_id = $post_or_order->get_id();
            $order    = $post_or_order;
        } elseif ( $post_or_order instanceof \WP_Post ) {
            $order_id = $post_or_order->ID;
            $order    = wc_get_order( $order_id );
        } else {
            return;
        }

        if ( ! $order ) {
            echo '<p>Order not found.</p>';
            return;
        }

        $serials    = SerialNumber::find_by_order( $order_id );
        $total_qty  = 0;
        foreach ( $order->get_items() as $item ) {
            $total_qty += $item->get_quantity();
        }
        $assigned   = count( $serials );
        $remaining  = max( 0, $total_qty - $assigned );
        $is_processing = $order->get_status() === 'processing';

        wp_nonce_field( 'epos_serial_number_nonce', 'epos_sn_nonce' );
        ?>
        <div id="epos-sn-box" data-order-id="<?php echo esc_attr( $order_id ); ?>">
            <p style="margin-bottom: 8px;">
                <strong><?php echo esc_html( $assigned ); ?></strong> / <?php echo esc_html( $total_qty ); ?> units assigned
                <?php if ( $remaining > 0 ) : ?>
                    <span style="color: #2eaf7d; margin-left: 4px;">(<?php echo esc_html( $remaining ); ?> remaining)</span>
                <?php endif; ?>
            </p>

            <?php if ( ! empty( $serials ) ) : ?>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
                    <?php foreach ( $serials as $sn ) : ?>
                        <tr class="epos-sn-row" style="border-bottom: 1px solid #eee;">
                            <td style="padding: 6px 0;">
                                <code style="font-size: 12px; background: #f0f0f1; padding: 2px 6px; border-radius: 3px;">
                                    <?php echo esc_html( $sn->serial_number ); ?>
                                </code>
                            </td>
                            <td style="padding: 6px 0; text-align: right;">
                                <?php if ( $is_processing ) : ?>
                                    <a href="#" class="epos-remove-sn" data-id="<?php echo esc_attr( $sn->id ); ?>" style="color: #d32f2f; text-decoration: none; font-size: 12px;">
                                        &times; Remove
                                    </a>
                                <?php endif; ?>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </table>
            <?php endif; ?>

            <?php if ( $is_processing && $remaining > 0 ) : ?>
                <div style="display: flex; gap: 4px; margin-top: 8px;">
                    <input
                        type="text"
                        id="epos-sn-input"
                        placeholder="Enter serial number"
                        style="flex: 1; min-width: 0;"
                    />
                    <button type="button" id="epos-sn-add" class="button button-primary" style="white-space: nowrap;">
                        Add
                    </button>
                </div>
                <p id="epos-sn-message" style="margin-top: 4px; font-size: 12px;"></p>
            <?php elseif ( ! $is_processing ) : ?>
                <p style="color: #717171; font-size: 12px; font-style: italic;">
                    Serial numbers can only be managed for orders with "processing" status.
                </p>
            <?php elseif ( $remaining <= 0 ) : ?>
                <p style="color: #2eaf7d; font-size: 12px;">
                    All units have serial numbers assigned.
                </p>
            <?php endif; ?>
        </div>
        <?php
    }

    /**
     * AJAX: Add a serial number.
     */
    public static function ajax_add_serial() {
        check_ajax_referer( 'epos_serial_number_nonce', 'nonce' );

        if ( ! current_user_can( 'epos_manage_affiliate' ) ) {
            wp_send_json_error( [ 'message' => 'Permission denied.' ], 403 );
        }

        $order_id      = absint( $_POST['order_id'] ?? 0 );
        $serial_number = trim( sanitize_text_field( $_POST['serial_number'] ?? '' ) );

        if ( ! $order_id || ! $serial_number ) {
            wp_send_json_error( [ 'message' => 'Order ID and serial number are required.' ] );
        }

        $order = wc_get_order( $order_id );
        if ( ! $order || $order->get_status() !== 'processing' ) {
            wp_send_json_error( [ 'message' => 'Order not found or not in processing status.' ] );
        }

        // Uniqueness check.
        if ( SerialNumber::find_by_serial( $serial_number ) ) {
            wp_send_json_error( [ 'message' => 'Serial number "' . $serial_number . '" already exists.' ] );
        }

        // Unit count check.
        $total_qty = 0;
        foreach ( $order->get_items() as $item ) {
            $total_qty += $item->get_quantity();
        }
        if ( SerialNumber::count_by_order( $order_id ) >= $total_qty ) {
            wp_send_json_error( [ 'message' => 'All units already have serial numbers.' ] );
        }

        // Get attribution data.
        $attribution = \EposAffiliate\Models\OrderAttribution::find_by_order( $order_id );

        $sn_id = SerialNumber::create( [
            'order_id'      => $order_id,
            'bd_id'         => $attribution->bd_id ?? null,
            'reseller_id'   => $attribution->reseller_id ?? null,
            'serial_number' => $serial_number,
            'source'        => 'manual',
        ] );

        if ( ! $sn_id ) {
            wp_send_json_error( [ 'message' => 'Failed to save serial number.' ] );
        }

        $order->add_order_note( sprintf( 'Serial number "%s" assigned by %s.', $serial_number, wp_get_current_user()->display_name ) );
        Logger::info( "SN '{$serial_number}' assigned to order #{$order_id} via order edit", 'SerialNumber' );

        wp_send_json_success( [ 'message' => 'Serial number assigned.', 'id' => $sn_id ] );
    }

    /**
     * AJAX: Remove a serial number.
     */
    public static function ajax_remove_serial() {
        check_ajax_referer( 'epos_serial_number_nonce', 'nonce' );

        if ( ! current_user_can( 'epos_manage_affiliate' ) ) {
            wp_send_json_error( [ 'message' => 'Permission denied.' ], 403 );
        }

        $id = absint( $_POST['id'] ?? 0 );
        $sn = SerialNumber::find( $id );

        if ( ! $sn ) {
            wp_send_json_error( [ 'message' => 'Serial number not found.' ] );
        }

        $order = wc_get_order( $sn->order_id );
        if ( $order ) {
            $order->add_order_note( sprintf( 'Serial number "%s" removed by %s.', $sn->serial_number, wp_get_current_user()->display_name ) );
        }

        SerialNumber::delete( $id );
        Logger::info( "SN '{$sn->serial_number}' removed from order #{$sn->order_id} via order edit", 'SerialNumber' );

        wp_send_json_success( [ 'message' => 'Serial number removed.' ] );
    }

    /**
     * Inline JS for the meta box (only on order edit screens).
     */
    public static function inline_script() {
        $screen = get_current_screen();
        if ( ! $screen ) {
            return;
        }

        $valid_screens = [ 'shop_order', 'woocommerce_page_wc-orders' ];
        if ( ! in_array( $screen->id, $valid_screens, true ) ) {
            return;
        }
        ?>
        <script>
        (function() {
            var box = document.getElementById('epos-sn-box');
            if (!box) return;

            var orderId = box.dataset.orderId;
            var nonce = document.getElementById('epos_sn_nonce')?.value || '';
            var input = document.getElementById('epos-sn-input');
            var addBtn = document.getElementById('epos-sn-add');
            var msg = document.getElementById('epos-sn-message');

            function showMsg(text, isError) {
                if (!msg) return;
                msg.textContent = text;
                msg.style.color = isError ? '#d32f2f' : '#2eaf7d';
            }

            if (addBtn && input) {
                addBtn.addEventListener('click', function() {
                    var sn = input.value.trim();
                    if (!sn) { showMsg('Enter a serial number.', true); return; }

                    addBtn.disabled = true;
                    addBtn.textContent = '...';

                    var fd = new FormData();
                    fd.append('action', 'epos_add_serial_number');
                    fd.append('nonce', nonce);
                    fd.append('order_id', orderId);
                    fd.append('serial_number', sn);

                    fetch(ajaxurl, { method: 'POST', body: fd })
                        .then(function(r) { return r.json(); })
                        .then(function(res) {
                            if (res.success) {
                                location.reload();
                            } else {
                                showMsg(res.data?.message || 'Error', true);
                                addBtn.disabled = false;
                                addBtn.textContent = 'Add';
                            }
                        })
                        .catch(function() {
                            showMsg('Request failed.', true);
                            addBtn.disabled = false;
                            addBtn.textContent = 'Add';
                        });
                });

                input.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter') { e.preventDefault(); addBtn.click(); }
                });
            }

            document.querySelectorAll('.epos-remove-sn').forEach(function(link) {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    if (!confirm('Remove this serial number?')) return;

                    var snId = this.dataset.id;
                    var fd = new FormData();
                    fd.append('action', 'epos_remove_serial_number');
                    fd.append('nonce', nonce);
                    fd.append('id', snId);

                    fetch(ajaxurl, { method: 'POST', body: fd })
                        .then(function(r) { return r.json(); })
                        .then(function(res) {
                            if (res.success) {
                                location.reload();
                            } else {
                                alert(res.data?.message || 'Error');
                            }
                        });
                });
            });
        })();
        </script>
        <?php
    }
}
