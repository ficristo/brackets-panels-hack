define(function (require, exports, module) {
    "use strict";

    var AppInit = brackets.getModule("utils/AppInit"),
        ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        WorkspaceManager = brackets.getModule("view/WorkspaceManager"),
        Mustache = brackets.getModule("thirdparty/mustache/mustache"),
        panelsContainerHtml = require("text!src/htmlContent/panels-container.html"),
        panelHeaderHtml = require("text!src/htmlContent/panel-header.html"),
        PANEL_ID = "brackets-panels-hack";

    var container = Mustache.render(panelsContainerHtml),
        $container = $(container);

    function hideAll() {
        var ids = WorkspaceManager.getAllPanelIDs();
        ids.forEach(function (id) {
            var panel = WorkspaceManager.getPanelForID(id);
            if (panel.isVisible()) {
                panel.hide();
            }
        });
    }

    function hijack(panel, title) {
        var header = Mustache.render(panelHeaderHtml, {
                title: title
            }),
            $header = $(header);

        var panelShow = panel.show;
        panel.show = function () {
            hideAll();
            return panelShow.apply(panel, arguments);
        };

        $header.find("a").on("click", function () {
            if (panel.isVisible()) {
                panel.hide();
            } else {
                hideAll();
                panel.show();
            }
        });
        $container.find(".nav-tabs").append($header);
        panel.$panel.insertBefore("#" + PANEL_ID);
    }

    AppInit.htmlReady(function () {
        ExtensionUtils.loadStyleSheet(module, "src/styles/nav-tabs-override.less");
        ExtensionUtils.loadStyleSheet(module, "src/styles/style.css");

        $container.insertBefore("#status-bar");

        var codeHintID = "errors",
            codeHintPanel = WorkspaceManager.getPanelForID(codeHintID),
            codeHintShow = $("#problems-panel").data("show");
        $("#problems-panel").data("show", function () {
            hideAll();
            return codeHintShow.apply(null, arguments);
        });
        hijack(codeHintPanel, "Code Hints");

        var searchID = "find-in-files.results",
            searchPanel = WorkspaceManager.getPanelForID(searchID);
        hijack(searchPanel, "Search");

        var createBottomPanel = WorkspaceManager.createBottomPanel;
        WorkspaceManager.createBottomPanel = function (id, $panel, height) {
            var panel = createBottomPanel.apply(null, [id, $panel, 200]);
            hijack(panel, id);
            return panel;
        };
    });
});
