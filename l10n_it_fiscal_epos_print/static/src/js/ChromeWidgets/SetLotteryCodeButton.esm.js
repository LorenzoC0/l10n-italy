/** @odoo-module **/

import {_t} from "web.core";
import PosComponent from "point_of_sale.PosComponent";
import ProductScreen from "point_of_sale.ProductScreen";
import Registries from "point_of_sale.Registries";

export class SetLotteryCodeButton extends PosComponent {
    setup() {
        super.setup();
    }

    get currentOrder() {
        return this.env.pos.get_order();
    }

    get buttonColor() {
        const order = this.currentOrder;
        return order?.lottery_code ? "lightgreen" : "#e2e2e2";
    }

    async onClick() {
        const {confirmed, payload} = await this.showPopup("LotteryCodePopup", {
            title: _t("Lottery Code"),
            lottery_code: this.currentOrder?.lottery_code || "",
        });

        if (confirmed && payload) {
            if (this.currentOrder) {
                this.currentOrder.lottery_code = payload;
            }
            this.render();
        }
    }
}

SetLotteryCodeButton.template = "l10n_it_fiscal_epos_print.SetLotteryCodeButton";

// Register as control button
ProductScreen.addControlButton({
    component: SetLotteryCodeButton,
});

Registries.Component.add(SetLotteryCodeButton);
