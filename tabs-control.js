// FIXME: Account for mismatched number of headers and sections.
(function() {

var OVERFLOW_LIMIT = 6;

// FIXME: Most of this inline style cruft should be unnecssary once scoped styles are available.
var CURRENT_TAB_STYLE = 'background: white; color: black; -webkit-user-select: none; text-shadow: 0 0 1px black';
var TAB_STYLE = 'font-family: \'Open Sans\'; font-size: 16px; line-height: 22px; font-weight: 400; padding: 5px 15px; margin: 0 5px 0 0; text-align: center; text-overflow: ellipsis; overflow: hidden; cursor: pointer; -webkit-user-select: none; border-top-left-radius: 6px; border-top-right-radius: 6px; background: rgb(242, 242, 242); color: rgb(64, 64, 64); box-shadow: 0 2px 2px rgba(0, 0, 0, .3);';
var MORE_STYLE = '';
var TAB_STRIP_STYLE = 'display: -webkit-flexbox; -webkit-flex-pack: justify; padding: 0 5px; -webkit-user-select: none;';
var TAB_WRAPPER_STYLE = 'display: -webkit-flexbox; height: 30px;';
var CURRENT_CONTENTS_STYLE = 'box-shadow: 0 2px 2px rgba(0, 0, 0, .3); background: white; border-radius: 3px; padding: 5px 20px; font-family: \'Open Sans\'; font-size: 14px; line-height: 20px; overflow: auto; height: 600px';
var CONTAINER_STYLE = 'display: -webkit-flexbox; -webkit-flex-direction: column; -webkit-flex-align: stretch; background: -webkit-linear-gradient(rgb(230, 230, 230), rgb(200, 200, 200)); padding: 10px; -webkit-font-smoothing: antialiased;';
var HELP_STYLE = 'background-color: #eee; padding: 5px 10px; margin: 2px 0 0 0; font-family: \'Open Sans\'; font-size: 11px; border-radius: 3px; box-shadow: 0 2px 2px rgba(0, 0, 0, .3);';
var OVERFLOW_STYLE = 'position: relative';
var OVERFLOW_TAB_STRIP_STYLE_CLOSED = 'display:none';
var OVERFLOW_TAB_STRIP_STYLE_OPEN = 'position:absolute; background: #fff; border: 1px solid #999; padding: 2px 0 2px 2px; right: 0; width: 300px';

// FIXME: Remove when Inspector support shadow DOM subtrees.
// Styles to debug.
// var CURRENT_TAB_STYLE = '';
// var TAB_STYLE = '';
// var MORE_STYLE = '';
// var TAB_STRIP_STYLE = '';
// var TAB_WRAPPER_STYLE = '';
// var CURRENT_CONTENTS_STYLE = '';
// var CONTAINER_STYLE = '';
// var HELP_STYLE = '';
// var OVERFLOW_STYLE = '';
// var OVERFLOW_TAB_STRIP_STYLE_CLOSED = '';
// var OVERFLOW_TAB_STRIP_STYLE_OPEN = '';

// FIXME: Should use HTML Templates once available.
var HTML_TEMPLATE = [
    // FIXME: These are tricky. They will break as soon as we implement the spec correctly. Wait until /select/ is implemented and convert.
    '<style>',
        'h2:nth-of-type(1) {', CURRENT_TAB_STYLE, '}', 
        'h2 {', TAB_STYLE, '}',
        'h2:nth-of-type(n+', OVERFLOW_LIMIT + 1, ') { text-align: left; box-shadow: none; border-radius: 0; background: white; }',
        'h2:nth-of-type(n+', OVERFLOW_LIMIT + 1, '):hover { background: rgba(0, 0, 0, .1); }',
    '</style>',
    '<style scoped>',
        'div.container {', CONTAINER_STYLE, '}',
        '.tab-strip {', TAB_STRIP_STYLE, '}',
        '.tab-wrapper {', TAB_WRAPPER_STYLE, '}',
        'div.overflow {', OVERFLOW_STYLE, '}',
        'div.overflow .tab-wrapper { overflow: hidden; }',
        'div.more {', TAB_STYLE, MORE_STYLE, '}',
        'div.overflow>div.closed {', OVERFLOW_TAB_STRIP_STYLE_CLOSED, '}',
        'div.overflow>div.open {', OVERFLOW_TAB_STRIP_STYLE_OPEN, '}',
        '.contents {', CURRENT_CONTENTS_STYLE, '}',
        '.help {', HELP_STYLE, '}',
    '</style>',
    '<div class="container">',
        '<div class="tab-strip">',
            '<div class="tab-wrapper">',
               '<content class="strip" select="h2:nth-of-type(-n+', OVERFLOW_LIMIT, ')"></content>',
            '</div>',
            '<div class="overflow">',
                '<div class="tab-wrapper">',
                    '<div class="more">&hellip;</div>',
                '</div>',
                '<div class="closed">',
                    '<content class="overflow" select="h2:nth-of-type(n+', OVERFLOW_LIMIT, ')"></content>',
                '</div>',
            '</div>',
        '</div>',
        '<div class="contents">',
            '<content class="current" select="section:nth-of-type(1)"></content>',
        '</div>',
        '<div class="help">',
            'Use <code>Ctrl+&lt;Number&gt;</code> to select the tab directly, <code>Ctrl+{</code> or <code>Ctrl+}</code> to cycle between tabs. Click on "&hellip;" to see more tabs.',
        '</div>',
    '</div>',
].join('');

function TabsControl(host)
{
    this.root = new WebKitShadowRoot(host);
    this.root.innerHTML = HTML_TEMPLATE;
    this.currentIndex = 1;
    this.moreOpened = false;
    this.style = this.root.querySelector('style').sheet;
    this.current = this.root.querySelector('content.current');
    var overflow = this.root.querySelector('.overflow');
    overflow.addEventListener('click', this.onClickOverflow.bind(this));
    this.more = overflow.querySelector('.more');
    this.menu = overflow.lastElementChild;
    this.updateCurrent();
    this.root.host.addEventListener('click', this.onClickTab.bind(this));
    window.addEventListener('click', this.onClickWindow.bind(this));
    window.addEventListener('keydown', this.onKeyDown.bind(this));
}

TabsControl.prototype = {
    onKeyDown: function(evt) {
        if (!evt.ctrlKey)
            return;

        if (evt.keyCode == 221) {
            this.cycle(1);
        } else if (evt.keyCode == 219) {
            this.cycle(-1);
        } else if (evt.keyCode > 48 && evt.keyCode < 58) {
            this.currentIndex = evt.keyCode - 48;
            this.updateCurrent();
        }
    },
    onClickTab: function(evt) {
        if (evt.target.nodeName == 'H2') {
            this.currentIndex = this.indexOf(evt.target) || this.currentIndex;
            this.updateCurrent();
        }
    },
    openMore: function() {
        this.menu.className = 'open';
        this.moreOpened = true;
    },
    closeMore: function()  {
        this.menu.className = 'closed';
        this.moreOpened = false;
    },
    onClickOverflow: function(evt) {
        if (evt.target.className != 'more')
            return;

        if (this.moreOpened)
            this.closeMore();
        else
            this.openMore();
        evt.stopPropagation();
    },
    onClickWindow: function(evt) {
        if (this.moreOpened)
            this.closeMore();
    },
    indexOf: function(header) {
        var index = 0;
        return [].slice.call(this.root.host.querySelectorAll('h2')).indexOf(header) + 1;
    },
    updateCurrent: function() {
        this.current.select = 'section:nth-of-type(' + this.currentIndex + ')';
        this.style.deleteRule(0);
        this.style.insertRule('h2:nth-of-type(' + this.currentIndex + '){' + CURRENT_TAB_STYLE + '}', 0);
    },
    sectionCount: function() {
        return this.root.host.querySelectorAll('section').length;
    },
    cycle: function(delta) {
        this.currentIndex += delta;
        var sectionCount = this.sectionCount();
        if (this.currentIndex > sectionCount) {
            this.currentIndex = sectionCount;
            return;
        }
        else if (this.currentIndex == 0) {
            this.currentIndex = 1;
            return;
        }
        this.updateCurrent();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    if (!window.WebKitShadowRoot)
        return;

    [].forEach.call(document.querySelectorAll('[is=tabs]'), function(element) {
        new TabsControl(element);
    });
})
    
}());