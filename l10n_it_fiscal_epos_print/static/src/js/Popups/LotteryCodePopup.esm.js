/** @odoo-module **/

import AbstractAwaitablePopup from "point_of_sale.AbstractAwaitablePopup";
import Registries from "point_of_sale.Registries";

const {useState, useRef, onMounted} = owl;

export class LotteryCodePopup extends AbstractAwaitablePopup {
    setup() {
        super.setup();
        this.state = useState({
            lotteryCode: this.props.lottery_code || "",
            showError: false,
        });
        this.inputRef = useRef("lotteryCodeInput");
        onMounted(() => {
            if (this.inputRef.el) {
                this.inputRef.el.focus();
            }
        });
    }

    onInputChange(ev) {
        this.state.lotteryCode = ev.target.value;
        this.state.showError = false;
    }

    getPayload() {
        return this.state.lotteryCode.trim();
    }

    async confirm() {
        const lotteryCode = this.state.lotteryCode.trim();

        if (!lotteryCode) {
            this.state.showError = true;
            return;
        }

        // Save lottery code to current order
        const currentOrder = this.env.pos.get_order();
        if (currentOrder) {
            currentOrder.lottery_code = lotteryCode;
        }

        // Call parent confirm to close popup and return payload
        return super.confirm();
    }
}

LotteryCodePopup.template = "l10n_it_fiscal_epos_print.LotteryCodePopup";
LotteryCodePopup.defaultProps = {
    title: "Lottery Code",
    lottery_code: "",
};

Registries.Component.add(LotteryCodePopup);
