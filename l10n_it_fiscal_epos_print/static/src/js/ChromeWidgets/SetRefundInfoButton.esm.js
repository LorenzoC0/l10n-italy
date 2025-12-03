/** @odoo-module **/

import PosComponent from "point_of_sale.PosComponent";
import ProductScreen from "point_of_sale.ProductScreen";
import Registries from "point_of_sale.Registries";
import {useListener} from "@web/core/utils/hooks";
import {_t} from "web.core";
import {refundUtils} from "../utils/refundUtils.esm";

export default class SetRefundInfoButton extends PosComponent {
    setup() {
        super.setup();
        useListener("click", this.onClick);
    }

    get currentOrder() {
        return this.env.pos.get_order();
    }

    get buttonColor() {
        return refundUtils.getButtonColor(this.currentOrder);
    }

    async onClick() {
        const currentOrder = this.currentOrder;
        await this.showPopup("RefundInfoPopup", {
            title: _t("Refund Information Details"),
            refund_date: String(currentOrder.refund_date || ""),
            refund_report: String(currentOrder.refund_report || ""),
            refund_doc_num: String(currentOrder.refund_doc_num || ""),
            refund_cash_fiscal_serial: String(currentOrder.refund_cash_fiscal_serial || ""),
            refund_full_refund: Boolean(currentOrder.refund_full_refund),
        });
        // Trigger re-render to update button color after popup closes
        this.render();
    }
}

SetRefundInfoButton.template = "l10n_it_fiscal_epos_print.SetRefundInfoButton";

// Register as control button with condition
ProductScreen.addControlButton({
    component: SetRefundInfoButton,
    condition: function () {
        const order = this.env.pos.get_order();
        return order && order.has_refund;
    },
});

Registries.Component.add(SetRefundInfoButton);
