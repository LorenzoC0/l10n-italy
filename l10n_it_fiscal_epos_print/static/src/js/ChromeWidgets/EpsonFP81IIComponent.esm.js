/** @odoo-module **/

import {_t} from "web.core";
import PosComponent from "point_of_sale.PosComponent";
import Registries from "point_of_sale.Registries";
import {Gui} from "point_of_sale.Gui";
import {EpsonEposPrint} from "../epson_epos_print.esm";

export class EpsonFP81IIComponent extends PosComponent {
    setup() {
        super.setup();
    }

    do_hide() {
        // eslint-disable-next-line no-undef
        const epsonFP81IIComponent = document.querySelector(
            ".status-buttons .epson-fp81ii-widget"
        );
        if (epsonFP81IIComponent) {
            epsonFP81IIComponent.classList.add("visually-hidden");
        }
    }

    onToggleComponent() {
        this.do_hide();
    }

    getPrinterOptions() {
        const protocol = this.env.pos.config.use_https ? "https://" : "http://";
        const printer_url = `${protocol}${this.env.pos.config.printer_ip}/cgi-bin/fpmate.cgi`;
        return {url: printer_url};
    }

    async zClosure() {
        this.do_hide();
        const printer_options = this.getPrinterOptions();
        const fp90 = new EpsonEposPrint(printer_options, this);

        const {confirmed} = await this.showPopup("ConfirmPopup", {
            title: _t("Confirm Printer Fiscal Closure (Report Z)?"),
            body: _t("Please confirm to execute the Printer Fiscal Closure"),
        });

        if (confirmed) {
            const cashier = this.env.pos.get_cashier();
            const operatorNumber = cashier?.fiscal_operator_number || "1";
            fp90.printFiscalZReport(operatorNumber);
        }
    }

    async fiscalXreport() {
        this.do_hide();
        const printer_options = this.getPrinterOptions();
        const fp90 = new EpsonEposPrint(printer_options, this);

        const {confirmed} = await this.showPopup("ConfirmPopup", {
            title: _t("Confirm Printer Daily Financial Report (Report X)?"),
            body: _t("Please confirm to execute the Printer Daily Financial Report"),
        });

        if (confirmed) {
            const cashier = this.env.pos.get_cashier();
            const operatorNumber = cashier?.fiscal_operator_number || "1";
            fp90.printFiscalXReport(operatorNumber);
        }
    }
}

EpsonFP81IIComponent.template = "l10n_it_fiscal_epos_print.EpsonFP81IIComponent";

Registries.Component.add(EpsonFP81IIComponent);
