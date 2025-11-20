/** @odoo-module **/

import TicketScreen from "point_of_sale.TicketScreen";
import {patch} from "@web/core/utils/patch";

patch(TicketScreen.prototype, "l10n_it_fiscal_epos_print.TicketScreen", {
    async onDoRefund() {
        const selected_order = this.getSelectedSyncedOrder();
        const res = this._super(...arguments);
        const new_order = this.env.pos.get_order();
        new_order.refund_report = selected_order.fiscal_z_rep_number;
        new_order.refund_doc_num = selected_order.fiscal_receipt_number;
        new_order.refund_date = selected_order.fiscal_receipt_date;
        new_order.refund_cash_fiscal_serial = selected_order.fiscal_printer_serial;
        return res;
    },

    onDoFullRefund() {
        const res = this._super(...arguments);
        const new_order = this.env.pos.get_order();
        new_order.refund_full_refund = true;
        return res;
    },
});
