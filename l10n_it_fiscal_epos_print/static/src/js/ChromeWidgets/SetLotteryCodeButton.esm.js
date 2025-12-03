/* @odoo-module */

import PosComponent from "point_of_sale.PosComponent";
import ProductScreen from "point_of_sale.ProductScreen";
import Registries from "point_of_sale.Registries";
import {useListener} from "@web/core/utils/hooks";

export default class SetLotteryCodeButton extends PosComponent {
    setup() {
        super.setup();
        useListener("click", this.onClick);
    }

    async onClick() {
        const currentOrder = this.env.pos.get_order();
        const {confirmed, payload} = await this.showPopup("LotteryCodePopup", {
            title: this.env._t("Lottery Code"),
            lottery_code: currentOrder?.lottery_code || "",
        });

        if (confirmed && payload) {
            if (currentOrder) {
                currentOrder.lottery_code = payload;
            }
        }
    }
}

SetLotteryCodeButton.template = "l10n_it_fiscal_epos_print.SetLotteryCodeButton";

ProductScreen.addControlButton({
    component: SetLotteryCodeButton,
});

Registries.Component.add(SetLotteryCodeButton);
