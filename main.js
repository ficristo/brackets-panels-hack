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

    function hijack(panel, panelId, tabId) {
        var $panel = panel.$panel;
        var title = $panel.find(".toolbar.simple-toolbar-layout > .title").text();
        if (!title) {
            title = panelId.replace(/^brackets-|\.panel$/g, "");
        }
        var header = Mustache.render(panelHeaderHtml, {
                tabId: tabId,
                panelId: panelId,
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
        hijack(codeHintPanel, "Code Hints", "tab-code-hints");
        $("#status-inspection").insertBefore("#" + PANEL_ID + " #tab-code-hints > a > p");

        var searchID = "find-in-files.results",
            searchPanel = WorkspaceManager.getPanelForID(searchID);
        hijack(searchPanel, "Search", "tab-search");

        var createBottomPanel = WorkspaceManager.createBottomPanel;
        WorkspaceManager.createBottomPanel = function (id, $panel, height) {
            var panel = createBottomPanel.apply(null, [id, $panel, undefined]);
            hijack(panel, id, "tab-" + id);
            return panel;
        };
    });
});
