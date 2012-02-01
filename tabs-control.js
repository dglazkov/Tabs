// FIXME: Account for mismatched number of headers and sections.
(function() {

var OVERFLOW_LIMIT = 6;

// FIXME: Most of this inline style cruft should be unnecssary once scoped styles are available.
var CURRENT_TAB_STYLE = 'background-color: #333; color: white; -webkit-user-select: none';
var TAB_STYLE = 'font-size: medium; font-weight: normal; margin: 0 2px 0 0; padding: 5px 15px; text-align: center; text-overflow: ellipsis; overflow: hidden; cursor: pointer; -webkit-user-select: none';
var MORE_STYLE = '';
var TAB_STRIP_STYLE = 'display: -webkit-flexbox; -webkit-flex-pack: justify; padding: 0 0 2px 0; -webkit-user-select: none';
var CURRENT_CONTENTS_STYLE = 'border: 1px solid #ccc; padding: 10px; overflow: auto; height: 600px';
var CONTAINER_STYLE = 'display: -webkit-flexbox; -webkit-flex-direction: column; -webkit-flex-align: stretch;';
var HELP_STYLE = 'background-color: #eee; padding: 5px 10px; margin: 2px 0 0 0; font-size: small;';
var OVERFLOW_STYLE = 'position: relative';
var OVERFLOW_TAB_STRIP_STYLE_CLOSED = 'display:none';
var OVERFLOW_TAB_STRIP_STYLE_OPEN = 'position:absolute; background: #fff; border: 1px solid #999; padding: 2px 0 2px 2px; right: 0; width: 300px';

// FIXME: Should use HTML Templates once available.
var HTML_TEMPLATE = [
    // FIXME: These are tricky. They should only apply to elements distributed to insertion points. The spec does not have anything like this.
    '<style>',
        'h2:nth-of-type(1) {', CURRENT_TAB_STYLE, '} ', 
        'h2 {', TAB_STYLE, '}',
        'h2:nth-of-type(n+', OVERFLOW_LIMIT, ') { text-align: left }',
        '.more { color: red }',
    '</style>',
    '<div style="', CONTAINER_STYLE, '">',
        '<div style="', TAB_STRIP_STYLE, '">',
            '<content class="strip" select="h2:nth-of-type(-n+', OVERFLOW_LIMIT, ')"></content>',
            '<div class="overflow" style="', OVERFLOW_STYLE, '">',
                '<div class="more" style="', TAB_STYLE, MORE_STYLE, '">&hellip;</div>',
                '<div style="', OVERFLOW_TAB_STRIP_STYLE_CLOSED, '">',
                    '<content class="overflow" select="h2:nth-of-type(n+', OVERFLOW_LIMIT, ')"></content>',
                '</div>',
            '</div>',
        '</div>',
        '<div style="', CURRENT_CONTENTS_STYLE, '">',
            '<content class="current" select="section:nth-of-type(1)"></content>',
        '</div>',
        '<div style="', HELP_STYLE, '">',
            'Use <code>Ctrl+&lt;Number&gt;</code> to select the tab directly, <code>Ctrl+{</code> or <code>Ctrl+}</code> to cycle between tabs. Click on "&hellip;" to see more tabs.',
        '</div>',
    '</div>',
].join('');

function TabsControl(host)
{
    this.root = new WebKitShadowRoot(host);
    // FIXME: Once root.innerHTML is available, remove the extra container.
    var container = document.createElement('div');
    container.innerHTML = HTML_TEMPLATE;
    this.root.appendChild(container);
    this.currentIndex = 1;
    this.moreOpened = false;
    this.style = container.querySelector('style').sheet;
    this.current = container.querySelector('content.current');
    this.overflow = container.querySelector('.overflow');
    this.overflow.addEventListener('click', this.onClickOverflow.bind(this));
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
        this.overflow.firstElementChild.style.cssText = CURRENT_TAB_STYLE + TAB_STYLE;
        this.overflow.lastElementChild.style.cssText = OVERFLOW_TAB_STRIP_STYLE_OPEN;
        this.moreOpened = true;
    },
    closeMore: function()  {
        this.overflow.firstElementChild.style.cssText = TAB_STYLE;
        this.overflow.lastElementChild.style.cssText = OVERFLOW_TAB_STRIP_STYLE_CLOSED;
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
        this.jiggle();
    },
    // FIXME: A hack to make content styles recalculate correctly.
    jiggle: function() {
        this.current.style.display = 'none';
        this.current.style.removeProperty('display');
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

    [].forEach.call(document.querySelectorAll('.tabs'), function(element) {
        new TabsControl(element);
    });
})
    
}());