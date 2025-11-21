/** @odoo-module **/

import PaymentScreen from "point_of_sale.PaymentScreen";
import Registries from "point_of_sale.Registries";
import {_t} from "web.core";
import {Gui} from "point_of_sale.Gui";
import {EpsonEposPrint} from "../../epson_epos_print.esm";

const FiscalPaymentScreen = (PaymentScreen) =>
    class extends PaymentScreen {
        setup() {
            super.setup();

            // Print Subtotal on screen if printer IP is configured
            if (this.env.pos.config.printer_ip) {
                const currentOrder = this.env.pos.get_order();
                const printer_options = currentOrder.getPrinterOptions();
                this.fp90 = new EpsonEposPrint(printer_options, this);
                const amount = currentOrder.get_total_with_tax().toFixed(2) + " €";
                this.fp90.printDisplayText(_t("SubTotal") + " " + amount);
            }
        }

        async sendToFP90Printer(order) {
            order.recomputeOrderData();
            this.fp90.order = order;
            await this.fp90.printFiscalReceipt(order);
        }

        async _finalizeValidation() {
            const currentOrder = this.currentOrder;
            if (this.env.pos.config.printer_ip && !currentOrder.is_to_invoice()) {
                await this.sendToFP90Printer(currentOrder);
                if (currentOrder._printed) {
                    await super._finalizeValidation();
                }
            } else {
                await super._finalizeValidation();
            }
        }

        _isOrderValid(isForceValidate) {
            // Validate tax configuration
            if (this.env.pos.config.iface_tax_included === "subtotal") {
                Gui.showPopup("ErrorPopup", {
                    title: _t("Wrong tax configuration"),
                    body: _t(
                        "Product prices on receipts must be set to 'Tax-Included Price' in POS configuration"
                    ),
                });
                return false;
            }

            const receipt = this.env.pos.get_order();

            // Check if order has refund items
            receipt.check_order_has_refund();

            // Validate refund information - simplified like Odoo 12
            if (
                receipt.has_refund &&
                (receipt.refund_date === null ||
                    receipt.refund_date === "" ||
                    receipt.refund_doc_num === null ||
                    receipt.refund_doc_num === "" ||
                    receipt.refund_cash_fiscal_serial === null ||
                    receipt.refund_cash_fiscal_serial === "" ||
                    receipt.refund_report === null ||
                    receipt.refund_report === "")
            ) {
                Gui.showPopup("ErrorPopup", {
                    title: _t("Refund Information Not Present"),
                    body: _t(
                        "The refund information isn't present. Please insert them before printing the receipt."
                    ),
                });
                return false;
            }

            return super._isOrderValid(isForceValidate);
        }
    };

Registries.Component.extend(PaymentScreen, FiscalPaymentScreen);
