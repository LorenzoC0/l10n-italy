/** @odoo-module **/

import {Order, Orderline, PosGlobalState} from "point_of_sale.models";
import Registries from "point_of_sale.Registries";
import {round_precision as round_pr} from "web.utils";

const FiscalPosGlobalState = (OriginalPosGlobalState) =>
    class extends OriginalPosGlobalState {
        set_refund_data(
            refund_date,
            refund_report,
            refund_doc_num,
            refund_cash_fiscal_serial,
            refund_full_refund
        ) {
            const selectedOrder = this.get_order();
            selectedOrder.refund_date = refund_date;
            selectedOrder.refund_report = refund_report;
            selectedOrder.refund_doc_num = refund_doc_num;
            selectedOrder.refund_cash_fiscal_serial = refund_cash_fiscal_serial;
            selectedOrder.refund_full_refund = refund_full_refund;
        }
    };

Registries.Model.extend(PosGlobalState, FiscalPosGlobalState);

const FiscalPosOrder = (OriginalOrder) =>
    class extends OriginalOrder {
        constructor(obj, options) {
            super(...arguments);
            // Initialize refund fields
            this.has_refund = false;
            this.refund_report = this.refund_report || null;
            this.refund_date = this.refund_date || null;
            this.refund_doc_num = this.refund_doc_num || null;
            this.refund_cash_fiscal_serial = this.refund_cash_fiscal_serial || null;
            this.refund_full_refund = this.refund_full_refund || false;
            // Check for refund items when order is created
            this.check_order_has_refund();
        }

        check_order_has_refund() {
            const lines = this.orderlines;
            this.has_refund = lines.some((line) => line.quantity < 0);
        }

        getPrinterOptions() {
            const config = this.pos.config;
            if (!config) return {url: null};
            const protocol = config.use_https ? "https://" : "http://";
            const printer_url = protocol + config.printer_ip + "/cgi-bin/fpmate.cgi";
            return {url: printer_url};
        }

        recomputeOrderData() {
            // In Odoo 16, order totals are computed on-the-fly through methods
            // This method exists for compatibility with Odoo 18 code
            // Trigger a recalculation by accessing the computed properties
            this.get_total_paid();
            this.get_total_tax();
            this.get_total_with_tax();
            this.get_change();
        }

        // Override export_as_JSON to fix integer fields with "null" string
        export_as_JSON() {
            const data = super.export_as_JSON(...arguments);

            // Integer fields that must not be "null" string
            const integerFields = [
                "refund_report",
                "refund_doc_num",
                "fiscal_receipt_number",
                "fiscal_z_rep_number",
            ];

            for (const field of integerFields) {
                // If the field exists in data and is "null" string, convert to false
                if (field in data) {
                    if (
                        data[field] === "null" ||
                        data[field] === null ||
                        data[field] === undefined ||
                        data[field] === ""
                    ) {
                        data[field] = false;
                    } else if (typeof data[field] === "string") {
                        // Try to parse as integer
                        const parsed = parseInt(data[field], 10);
                        data[field] = isNaN(parsed) ? false : parsed;
                    }
                }
            }

            // Handle other fields that might have "null" string
            const otherFields = [
                "refund_date",
                "refund_cash_fiscal_serial",
                "fiscal_receipt_date",
                "fiscal_printer_serial",
                "fiscal_printer_debug_info",
                "fiscal_operator_number",
                "lottery_code",
            ];

            for (const field of otherFields) {
                if (field in data && (data[field] === "null" || data[field] === null)) {
                    data[field] = false;
                }
            }

            // Ensure fiscal_receipt_amount is a number
            if ("fiscal_receipt_amount" in data) {
                if (
                    data.fiscal_receipt_amount === "null" ||
                    data.fiscal_receipt_amount === null
                ) {
                    data.fiscal_receipt_amount = 0;
                } else if (typeof data.fiscal_receipt_amount === "string") {
                    data.fiscal_receipt_amount =
                        parseFloat(data.fiscal_receipt_amount) || 0;
                }
            }

            return data;
        }
    };

Registries.Model.extend(Order, FiscalPosOrder);

const FiscalOrderline = (OriginalOrderline) =>
    class extends OriginalOrderline {
        constructor(obj, options) {
            super(...arguments);
            // Check order for refunds when line is created
            if (this.order) {
                this.order.check_order_has_refund();
            }
        }

        set_quantity(quantity, keep_price) {
            const result = super.set_quantity(quantity, keep_price);
            // Check order for refunds when quantity changes
            if (this.order) {
                this.order.check_order_has_refund();
            }
            return result;
        }

        set_fp_data() {
            const applicable_taxes = this.get_applicable_taxes();
            if (applicable_taxes.length !== 1) {
                // Fiscal Print Error: Product must have exactly one tax
                return;
            }
            this.tax_department = applicable_taxes[0];
            if (this.tax_department.price_include === true) {
                this.price_unit_incl = this.price;
            } else {
                // This strategy was used because JavaScript's Math.round rounds to the nearest integer
                const rounding = this.pos.currency.rounding;
                this.price_unit_incl = round_pr(
                    this.price * (1 + this.tax_department.amount / 100),
                    rounding
                );
            }
        }
    };

Registries.Model.extend(Orderline, FiscalOrderline);
