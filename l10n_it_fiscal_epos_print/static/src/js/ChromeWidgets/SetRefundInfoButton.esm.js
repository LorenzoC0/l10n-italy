/** @odoo-module **/

import PosComponent from "point_of_sale.PosComponent";
import ProductScreen from "point_of_sale.ProductScreen";
import Registries from "point_of_sale.Registries";
import {refundUtils} from "../utils/refundUtils.esm";
import {useListener} from "@web/core/utils/hooks";

const {useState, onMounted, onWillUnmount} = owl;

export class SetRefundInfoButton extends PosComponent {
    setup() {
        super.setup();
        this.state = useState({
            buttonColor: "#e2e2e2",
        });

        // Listen for order changes
        onMounted(() => {
            this._updateButtonColor();
            this._setupOrderListeners();
        });

        onWillUnmount(() => {
            this._removeOrderListeners();
        });

        useListener('click', this.onClick);
    }

    _setupOrderListeners() {
        const order = this.env.pos.get_order();
        if (order) {
            // Listen to orderline changes
            this.orderLinesHandler = () => this._onOrderlineChange();
            order.orderlines.on('change add remove', this.orderLinesHandler, this);
        }

        // Listen to order changes
        this.orderChangeHandler = () => {
            this._removeOrderListeners();
            this._setupOrderListeners();
            this._onOrderlineChange();
        };
        this.env.pos.on('change:selectedOrder', this.orderChangeHandler, this);
    }

    _removeOrderListeners() {
        const order = this.env.pos.get_order();
        if (order && this.orderLinesHandler) {
            order.orderlines.off('change add remove', this.orderLinesHandler, this);
        }
        if (this.orderChangeHandler) {
            this.env.pos.off('change:selectedOrder', this.orderChangeHandler, this);
        }
    }

    _onOrderlineChange() {
        const order = this.env.pos.get_order();
        if (order) {
            order.check_order_has_refund();
        }
        this._updateButtonColor();
    }

    _updateButtonColor() {
        this.state.buttonColor = this.buttonColor;
    }

    get currentOrder() {
        return this.env.pos.get_order();
    }

    get buttonColor() {
        return refundUtils.getButtonColor(this.currentOrder);
    }

    is_available() {
        const order = this.currentOrder;
        // Only show if order has refund items
        return order && order.has_refund;
    }

    async onClick() {
        await refundUtils.showRefundPopup(this.env.pos, () => {
            this._updateButtonColor();
        });
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
