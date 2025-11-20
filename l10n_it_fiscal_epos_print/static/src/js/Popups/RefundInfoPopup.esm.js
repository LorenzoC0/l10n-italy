/** @odoo-module **/

import AbstractAwaitablePopup from "point_of_sale.AbstractAwaitablePopup";
import Registries from "point_of_sale.Registries";
import {_t} from "web.core";

const {useState, useRef, onMounted} = owl;

export class RefundInfoPopup extends AbstractAwaitablePopup {
    setup() {
        super.setup();
        this.state = useState({
            showError: false,
        });
        this.inputRefundReport = useRef("inputRefundReport");
        this.inputRefundDate = useRef("inputRefundDate");
        this.inputRefundDocNum = useRef("inputRefundDocNum");
        this.inputRefundCashFiscalSerial = useRef("inputRefundCashFiscalSerial");
        this.inputRefundFullRefund = useRef("inputRefundFullRefund");

        onMounted(() => {
            if (this.inputRefundDate.el) {
                this.inputRefundDate.el.focus();
            }
        });
    }

    async confirm() {
        this.clickConfirmRefund();
    }

    clickConfirmRefund() {
        const allValid = () => {
            return (
                this.inputRefundDate.el && this.inputRefundDate.el.value &&
                this.inputRefundReport.el && this.inputRefundReport.el.value &&
                this.inputRefundDocNum.el && this.inputRefundDocNum.el.value &&
                this.inputRefundCashFiscalSerial.el &&
                this.inputRefundCashFiscalSerial.el.value
            );
        };

        if (allValid()) {
            this.state.showError = false;
            const refund_date = this.inputRefundDate.el.value;
            const refund_report = this.inputRefundReport.el.value;
            const refund_doc_num = this.inputRefundDocNum.el.value;
            const refund_cash_fiscal_serial =
                this.inputRefundCashFiscalSerial.el.value;
            const refund_full_refund = this.inputRefundFullRefund.el
                ? this.inputRefundFullRefund.el.checked
                : false;

            this.env.pos.context = {
                refund_details: true,
                refund_date: refund_date,
                refund_report: refund_report,
                refund_doc_num: refund_doc_num,
                refund_cash_fiscal_serial: refund_cash_fiscal_serial,
                refund_full_refund: refund_full_refund,
            };

            this.env.pos.set_refund_data(
                refund_date,
                refund_report,
                refund_doc_num,
                refund_cash_fiscal_serial,
                refund_full_refund
            );

            if (
                this.props.update_refund_info_button &&
                this.props.update_refund_info_button instanceof Function
            ) {
                this.props.update_refund_info_button();
            }

            super.confirm();
        } else {
            this.state.showError = true;
        }
    }

    getPayload() {
        return {
            refund_date: this.inputRefundDate.el ? this.inputRefundDate.el.value : "",
            refund_report: this.inputRefundReport.el
                ? this.inputRefundReport.el.value
                : "",
            refund_doc_num: this.inputRefundDocNum.el
                ? this.inputRefundDocNum.el.value
                : "",
            refund_cash_fiscal_serial: this.inputRefundCashFiscalSerial.el
                ? this.inputRefundCashFiscalSerial.el.value
                : "",
            refund_full_refund: this.inputRefundFullRefund.el
                ? this.inputRefundFullRefund.el.checked
                : false,
        };
    }
}

RefundInfoPopup.template = "l10n_it_fiscal_epos_print.RefundInfoPopup";
RefundInfoPopup.defaultProps = {
    confirmText: _t("Ok"),
    cancelText: _t("Cancel"),
    title: _t("Refund Information Details"),
    refund_date: "",
    refund_report: "",
    refund_doc_num: "",
    refund_cash_fiscal_serial: "",
    refund_full_refund: false,
};

Registries.Component.add(RefundInfoPopup);
