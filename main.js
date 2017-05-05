define(function (require, exports, module) {
    "use strict";

    var AppInit = brackets.getModule("utils/AppInit"),
        ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        WorkspaceManager = brackets.getModule("view/WorkspaceManager"),
        Mustache = brackets.getModule("thirdparty/mustache/mustache"),
        panelsContainerHtml = require("text!src/htmlContent/panels-container.html"),
        panelHeaderHtml = require("text!src/htmlContent/panel-header.html"),
        PANEL_ID = "brackets-panels-hack",
        ID_PREFIX = "tab-";

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
            $header.addClass("active");
            return panelShow.apply(panel, arguments);
        };

        var panelHide = panel.hide;
        panel.hide = function () {
            $header.removeClass("active");
            return panelHide.apply(panel, arguments);
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
            codeHintShow = $("#problems-panel").data("show"),
            codeHintHide = $("#problems-panel").data("hide");
        $("#problems-panel").data("show", function () {
            hideAll();
            var $header = $container.find(".nav-tabs #" + ID_PREFIX + "code-hints");
            $header.addClass("active");
            return codeHintShow.apply(null, arguments);
        });
        $("#problems-panel").data("hide", function () {
            var $header = $container.find(".nav-tabs #" + ID_PREFIX + "code-hints");
            $header.removeClass("active");
            return codeHintHide.apply(null, arguments);
        });
        hijack(codeHintPanel, "Code Hints", ID_PREFIX + "code-hints");
        $("#status-inspection").insertBefore("#" + PANEL_ID + " #" + ID_PREFIX + "code-hints > a > p");

        var searchID = "find-in-files.results",
            searchPanel = WorkspaceManager.getPanelForID(searchID);
        hijack(searchPanel, "Search", ID_PREFIX + "search");

        var createBottomPanel = WorkspaceManager.createBottomPanel;
        WorkspaceManager.createBottomPanel = function (id, $panel, height) {
            var panel = createBottomPanel.apply(null, [id, $panel, undefined]);
            hijack(panel, id, ID_PREFIX + id);
            return panel;
        };
    });
});
