jQuery(function(){
    initInputs();
    initDropDown();
    jcf.customForms.replaceAll();
    initSameHeight();
    initLayout();
});
// set same column height
function initSameHeight(){
    jQuery('.container').sameHeight({
        elements: '#content, #sidebar',
        flexible: true
    });
}

jQuery(window).load(function() {
    jQuery(window).resize();
})

// responsive layout handling
function initLayout() {
    // handle layout resize
    ResponsiveHelper.addRange({
        '..767': {
            on: function() {
                jQuery('div.gallery2').fadeGallery({
                    slides: '.gallery2-holder > ul > li .box',
                    switchSimultaneously: true,
                    disableWhileAnimating: false,
                    autoRotation: true,
                    autoHeight: true,
                    switchTime: 4000,
                    btnPrev: '.meta a.btn-prev',
                    btnNext: '.meta a.btn-next',
                    animSpeed: 600
                });
            },
            off: function() {
                jQuery('div.gallery2').fadeGallery('destroy');
            }
        },
        '768..': {
            on: function() {
                jQuery('div.gallery2').fadeGallery({
                    slides: '.gallery2-holder > ul > li',
                    switchSimultaneously: true,
                    disableWhileAnimating: false,
                    autoRotation: true,
                    autoHeight: true,
                    switchTime: 4000,
                    btnPrev: '.meta a.btn-prev',
                    btnNext: '.meta a.btn-next',
                    animSpeed: 600
                });
            },
            off: function() {
                jQuery('div.gallery2').fadeGallery('destroy');
            }
        }
    });
}

/*
 * Responsive Layout helper
 */
ResponsiveHelper = (function($){
    // init variables
    var handlers = [];
    var win = $(window), prevWinWidth;

    // prepare resize handler
    function resizeHandler() {
        var winWidth = win.width() + scrollSize.getWidth();
        if(winWidth !== prevWinWidth) {
            prevWinWidth = winWidth;

            // loop through range groups
            $.each(handlers, function(index, rangeObject){
                $.each(rangeObject.data, function(property, item) {
                    if(winWidth >= item.range[0] && winWidth <= item.range[1] && rangeObject.previousActiveSection !== property) {
                        // save current section
                        var currentSection = property;
                        var previousSection = rangeObject.previousActiveSection;
                        rangeObject.previousActiveSection = currentSection;

                        // disable active section
                        if(typeof previousSection !== 'undefined' && typeof rangeObject.data[previousSection].disableCallback === 'function') {
                            rangeObject.data[previousSection].disableCallback(currentSection);
                        }

                        // make callback
                        if(typeof item.enableCallback === 'function') {
                            item.enableCallback(previousSection);
                        }
                        return false;
                    }
                });
            });
        }
    }
    win.bind('resize orientationchange', resizeHandler);

    // range parser
    function parseRange(rangeStr) {
        var rangeData = rangeStr.split('..');
        var x1 = parseInt(rangeData[0]) || -Infinity;
        var x2 = parseInt(rangeData[1]) || Infinity;
        return [x1, x2].sort();
    }

    // export public functions
    return {
        addRange: function(ranges) {
            // parse data and add items to collection
            result = {data:{}};
            $.each(ranges, function(property, data){
                result.data[property] = {
                    range: parseRange(property),
                    enableCallback: data.on,
                    disableCallback: data.off
                };
            });
            handlers.push(result);

            // call resizeHandler to recalculate all events
            resizeHandler();
        }
    }
}(jQuery));


var scrollSize = (function(){
    var content, hold, sizeBefore, sizeAfter;
    function buildSizer(){
        if(hold) removeSizer();
        content = document.createElement('div');
        hold = document.createElement('div');
        hold.style.cssText = 'position:absolute;overflow:hidden;width:100px;height:100px';
        hold.appendChild(content);
        document.body.appendChild(hold);
    }
    function removeSizer(){
        document.body.removeChild(hold);
        hold = null;
    }
    function calcSize(vertical) {
        buildSizer();
        content.style.cssText = 'height:'+(vertical ? '100%' : '200px');
        sizeBefore = (vertical ? content.offsetHeight : content.offsetWidth);
        hold.style.overflow = 'scroll'; content.innerHTML = 1;
        sizeAfter = (vertical ? content.offsetHeight : content.offsetWidth);
        if(vertical && hold.clientHeight) sizeAfter = hold.clientHeight;
        removeSizer();
        return sizeBefore - sizeAfter;
    }
    return {
        getWidth:function(){
            return calcSize(false);
        },
        getHeight:function(){
            return calcSize(true)
        }
    }
}());

/*
 * jQuery SlideShow plugin
 */
;(function($){
    function FadeGallery(options) {
        this.options = $.extend({
            parent: 'ul',
            slides: 'ul.slideset > li',
            activeClass:'active',
            disabledClass:'disabled',
            btnPrev: 'a.btn-prev',
            btnNext: 'a.btn-next',
            generatePagination: false,
            pagerList: '<ul>',
            pagerListItem: '<li><a href="#"></a></li>',
            pagerListItemText: 'a',
            pagerLinks: '.pagination li',
            currentNumber: 'span.current-num',
            totalNumber: 'span.total-num',
            btnPlay: '.btn-play',
            btnPause: '.btn-pause',
            btnPlayPause: '.btn-play-pause',
            autorotationActiveClass: 'autorotation-active',
            autorotationDisabledClass: 'autorotation-disabled',
            autorotationStopAfterClick: false,
            circularRotation: true,
            switchSimultaneously: true,
            disableWhileAnimating: false,
            disableFadeIE: false,
            autoRotation: false,
            pauseOnHover: true,
            autoHeight: false,
            switchTime: 4000,
            animSpeed: 600,
            event:'click'
        }, options);
        this.init();
    }
    FadeGallery.prototype = {
        init: function() {
            if(this.options.holder) {
                this.findElements();
                this.initStructure();
                this.attachEvents();
                this.refreshState(true);
                this.autoRotate();
                this.makeCallback('onInit', this);
            }
        },
        findElements: function() {
            // control elements
            this.gallery = $(this.options.holder);
            this.slides = this.gallery.find(this.options.slides);
            this.slidesHolder = this.slides.eq(0).closest(this.options.parent);
            this.stepsCount = this.slides.length;
            this.btnPrev = this.gallery.find(this.options.btnPrev);
            this.btnNext = this.gallery.find(this.options.btnNext);
            this.currentIndex = 0;

            // disable fade effect in old IE
            if(this.options.disableFadeIE && $.browser.msie && $.browser.version < 9) {
                this.options.animSpeed = 0;
            }

            // create gallery pagination
            if(typeof this.options.generatePagination === 'string') {
                this.pagerHolder = this.gallery.find(this.options.generatePagination).empty();
                this.pagerList = $(this.options.pagerList).appendTo(this.pagerHolder);
                for(var i = 0; i < this.stepsCount; i++) {
                    $(this.options.pagerListItem).appendTo(this.pagerList).find(this.options.pagerListItemText).text(i+1);
                }
                this.pagerLinks = this.pagerList.children();
            } else {
                this.pagerLinks = this.gallery.find(this.options.pagerLinks);
            }

            // get start index
            var activeSlide = this.slides.filter('.'+this.options.activeClass);
            if(activeSlide.length) {
                this.currentIndex = this.slides.index(activeSlide);
            }
            this.prevIndex = this.currentIndex;

            // autorotation control buttons
            this.btnPlay = this.gallery.find(this.options.btnPlay);
            this.btnPause = this.gallery.find(this.options.btnPause);
            this.btnPlayPause = this.gallery.find(this.options.btnPlayPause);

            // misc elements
            this.curNum = this.gallery.find(this.options.currentNumber);
            this.allNum = this.gallery.find(this.options.totalNumber);

            // handle flexible layout
            $(window).bind('resize.FG orientationchange.FG', $.proxy(this.onWindowResize, this));
        },
        initStructure: function() {
            this.slides.css({display:'block',opacity:0}).eq(this.currentIndex).css({
                opacity:''
            });
        },
        attachEvents: function() {
            var self = this;
            this.btnPrev.bind(this.options.event + '.FG', function(e){
                self.prevSlide();
                if(self.options.autorotationStopAfterClick) {
                    self.stopRotation();
                }
                e.preventDefault();
            });
            this.btnNext.bind(this.options.event + '.FG', function(e){
                self.nextSlide();
                if(self.options.autorotationStopAfterClick) {
                    self.stopRotation();
                }
                e.preventDefault();
            });
            this.pagerLinks.each(function(ind, obj){
                $(obj).bind(self.options.event + '.FG', function(e){
                    self.numSlide(ind);
                    if(self.options.autorotationStopAfterClick) {
                        self.stopRotation();
                    }
                    e.preventDefault();
                });
            });

            // autorotation buttons handler
            this.btnPlay.bind(this.options.event + '.FG', function(e){
                self.startRotation();
                e.preventDefault();
            });
            this.btnPause.bind(this.options.event + '.FG', function(e){
                self.stopRotation();
                e.preventDefault();
            });
            this.btnPlayPause.bind(this.options.event + '.FG', function(e){
                if(!self.gallery.hasClass(self.options.autorotationActiveClass)) {
                    self.startRotation();
                } else {
                    self.stopRotation();
                }
                e.preventDefault();
            });

            // pause on hover handling
            if(this.options.pauseOnHover) {
                this.gallery.bind({
                    'mouseenter.FG': function(){
                        if(self.options.autoRotation) {
                            self.galleryHover = true;
                            self.pauseRotation();
                        }
                    },
                    'mouseleave.FG': function() {
                        if(self.options.autoRotation) {
                            self.galleryHover = false;
                            self.resumeRotation();
                        }
                    }
                });
            }
        },
        onWindowResize: function(){
            if(this.options.autoHeight) {
                this.slidesHolder.css({height: this.slides.eq(this.currentIndex).outerHeight(true) });
            }
        },
        prevSlide: function() {
            if(!(this.options.disableWhileAnimating && this.galleryAnimating)) {
                this.prevIndex = this.currentIndex;
                if(this.currentIndex > 0) {
                    this.currentIndex--;
                    this.switchSlide();
                } else if(this.options.circularRotation) {
                    this.currentIndex = this.stepsCount - 1;
                    this.switchSlide();
                }
            }
        },
        nextSlide: function(fromAutoRotation) {
            if(!(this.options.disableWhileAnimating && this.galleryAnimating)) {
                this.prevIndex = this.currentIndex;
                if(this.currentIndex < this.stepsCount - 1) {
                    this.currentIndex++;
                    this.switchSlide();
                } else if(this.options.circularRotation || fromAutoRotation === true) {
                    this.currentIndex = 0;
                    this.switchSlide();
                }
            }
        },
        numSlide: function(c) {
            if(this.currentIndex != c) {
                this.prevIndex = this.currentIndex;
                this.currentIndex = c;
                this.switchSlide();
            }
        },
        switchSlide: function() {
            var self = this;
            if(this.slides.length > 1) {
                this.galleryAnimating = true;
                if(!this.options.animSpeed) {
                    this.slides.eq(this.prevIndex).css({opacity:0});
                } else {
                    this.slides.eq(this.prevIndex).stop().animate({opacity:0},{duration: this.options.animSpeed});
                }

                this.switchNext = function() {
                    if(!self.options.animSpeed) {
                        self.slides.eq(self.currentIndex).css({opacity:''});
                    } else {
                        self.slides.eq(self.currentIndex).stop().animate({opacity:1},{duration: self.options.animSpeed});
                    }
                    setTimeout(function() {
                        self.slides.eq(self.currentIndex).css({opacity:''});
                        self.galleryAnimating = false;
                        self.autoRotate();

                        // onchange callback
                        self.makeCallback('onChange', self);
                    }, self.options.animSpeed);
                }

                if(this.options.switchSimultaneously) {
                    self.switchNext();
                } else {
                    clearTimeout(this.switchTimer);
                    this.switchTimer = setTimeout(function(){
                        self.switchNext();
                    }, this.options.animSpeed);
                }
                this.refreshState();

                // onchange callback
                this.makeCallback('onBeforeChange', this);
            }
        },
        refreshState: function(initial) {
            this.slides.removeClass(this.options.activeClass).eq(this.currentIndex).addClass(this.options.activeClass);
            this.pagerLinks.removeClass(this.options.activeClass).eq(this.currentIndex).addClass(this.options.activeClass);
            this.curNum.html(this.currentIndex+1);
            this.allNum.html(this.stepsCount);

            // initial refresh
            if(this.options.autoHeight) {
                if(initial) {
                    this.slidesHolder.css({height: this.slides.eq(this.currentIndex).outerHeight(true) });
                } else {
                    this.slidesHolder.stop().animate({height: this.slides.eq(this.currentIndex).outerHeight(true)}, {duration: this.options.animSpeed});
                }
            }

            // disabled state
            if(!this.options.circularRotation) {
                this.btnPrev.add(this.btnNext).removeClass(this.options.disabledClass);
                if(this.currentIndex === 0) this.btnPrev.addClass(this.options.disabledClass);
                if(this.currentIndex === this.stepsCount - 1) this.btnNext.addClass(this.options.disabledClass);
            }
        },
        startRotation: function() {
            this.options.autoRotation = true;
            this.galleryHover = false;
            this.autoRotationStopped = false;
            this.resumeRotation();
        },
        stopRotation: function() {
            this.galleryHover = true;
            this.autoRotationStopped = true;
            this.pauseRotation();
        },
        pauseRotation: function() {
            this.gallery.addClass(this.options.autorotationDisabledClass);
            this.gallery.removeClass(this.options.autorotationActiveClass);
            clearTimeout(this.timer);
        },
        resumeRotation: function() {
            if(!this.autoRotationStopped) {
                this.gallery.addClass(this.options.autorotationActiveClass);
                this.gallery.removeClass(this.options.autorotationDisabledClass);
                this.autoRotate();
            }
        },
        autoRotate: function() {
            var self = this;
            clearTimeout(this.timer);
            if(this.options.autoRotation && !this.galleryHover && !this.autoRotationStopped) {
                this.gallery.addClass(this.options.autorotationActiveClass);
                this.timer = setTimeout(function(){
                    self.nextSlide(true);
                }, this.options.switchTime);
            } else {
                this.pauseRotation();
            }
        },
        makeCallback: function(name) {
            if(typeof this.options[name] === 'function') {
                var args = Array.prototype.slice.call(arguments);
                args.shift();
                this.options[name].apply(this, args);
            }
        },
        destroy: function() {
            this.stopRotation();
            $(this).data('FadeGallery', null);
            $(window).unbind('resize.FG orientationchange.FG');
            this.slides.css({display:'',opacity:''});


            this.btnPrev.unbind(this.options.event + '.FG');
            this.btnNext.unbind(this.options.event + '.FG');
            this.pagerLinks.each(function(ind, obj){
                $(obj).unbind(self.options.event + '.FG');
            });

            // autorotation buttons handler
            this.btnPlay.unbind(this.options.event + '.FG');
            this.btnPause.unbind(this.options.event + '.FG');
            this.btnPlayPause.unbind(this.options.event + '.FG');

            // pause on hover handling
            if(this.options.pauseOnHover) {
                this.gallery.unbind('mouseenter.FG mouseleave.FG')
            }
        }
    }

    // jquery plugin
    $.fn.fadeGallery = function(opt){
        return this.each(function(){
            if(typeof opt === 'object' || typeof opt === 'undefined') {
                $(this).data('FadeGallery', new FadeGallery($.extend(opt,{holder:this})));
            } else if(typeof opt === 'string' && $(this).data('FadeGallery')) {
                $(this).data('FadeGallery')[opt]();
            }
        });
    }
}(jQuery));
/*
 * jQuery SameHeight plugin
 */
;(function($){
    $.fn.sameHeight = function(opt) {
        var options = $.extend({
            skipClass: 'same-height-ignore',
            leftEdgeClass: 'same-height-left',
            rightEdgeClass: 'same-height-right',
            elements: '>*',
            flexible: false,
            multiLine: false,
            useMinHeight: false
        },opt);
        return this.each(function(){
            var holder = $(this), postResizeTimer;
            var elements = holder.find(options.elements).not('.' + options.skipClass);
            if(!elements.length) return;

            // resize handler
            function doResize() {
                elements.css(options.useMinHeight && supportMinHeight ? 'minHeight' : 'height', '');
                if(options.multiLine) {
                    // resize elements row by row
                    resizeElementsByRows(elements, options);
                } else {
                    // resize elements by holder
                    resizeElements(elements, holder, options);
                }
            }
            doResize();

            // handle flexible layout / font resize
            if(options.flexible) {
                $(window).bind('resize orientationchange fontresize', function(e){
                    doResize();
                    clearTimeout(postResizeTimer);
                    postResizeTimer = setTimeout(doResize, 100);
                });
            }
            // handle complete page load including images and fonts
            $(window).bind('load', function(){
                doResize();
                clearTimeout(postResizeTimer);
                postResizeTimer = setTimeout(doResize, 100);
            });
        });
    }

    // detect css min-height support
    var supportMinHeight = typeof document.documentElement.style.maxHeight !== 'undefined';

    // get elements by rows
    function resizeElementsByRows(boxes, options) {
        var currentRow = $(), maxHeight, firstOffset = boxes.eq(0).offset().top;
        boxes.each(function(ind){
            var curItem = $(this);
            if(curItem.offset().top === firstOffset) {
                currentRow = currentRow.add(this);
            } else {
                maxHeight = getMaxHeight(currentRow);
                resizeElements(currentRow, maxHeight, options);
                currentRow = curItem;
                firstOffset = curItem.offset().top;
            }
        });
        if(currentRow.length) {
            maxHeight = getMaxHeight(currentRow);
            resizeElements(currentRow, maxHeight, options);
        }
    }

    // calculate max element height
    function getMaxHeight(boxes) {
        var maxHeight = 0;
        boxes.each(function(){
            maxHeight = Math.max(maxHeight, $(this).outerHeight());
        });
        return maxHeight;
    }

    // resize helper function
    function resizeElements(boxes, parent, options) {
        var parentHeight = typeof parent === 'number' ? parent : parent.height();
        boxes.removeClass(options.leftEdgeClass).removeClass(options.rightEdgeClass).each(function(i){
            var element = $(this);
            var depthDiffHeight = 0;

            if(typeof parent !== 'number') {
                element.parents().each(function(){
                    var tmpParent = $(this);
                    if(this === parent[0]) {
                        return false;
                    } else {
                        depthDiffHeight += tmpParent.outerHeight() - tmpParent.height();
                    }
                });
            }
            var calcHeight = parentHeight - depthDiffHeight - (element.outerHeight() - element.height());
            if(calcHeight > 0) {
                element.css(options.useMinHeight && supportMinHeight ? 'minHeight' : 'height', calcHeight);
            }
        });
        boxes.filter(':first').addClass(options.leftEdgeClass);
        boxes.filter(':last').addClass(options.rightEdgeClass);
    }
}(jQuery));

/*
 * jQuery FontResize Event
 */
jQuery.onFontResize = (function($) {
    $(function() {
        var randomID = 'font-resize-frame-' + Math.floor(Math.random() * 1000);
        var resizeFrame = $('<iframe>').attr('id', randomID).addClass('font-resize-helper');

        // required styles
        resizeFrame.css({
            width: '100em',
            height: '10px',
            position: 'absolute',
            borderWidth: 0,
            top: '-9999px',
            left: '-9999px'
        }).appendTo('body');

        // use native IE resize event if possible
        if ($.browser.msie && $.browser.version < 9) {
            resizeFrame.bind('resize', function () {
                $.onFontResize.trigger(resizeFrame[0].offsetWidth / 100);
            });
        }
        // use script inside the iframe to detect resize for other browsers
        else {
            var doc = resizeFrame[0].contentWindow.document;
            doc.open();
            doc.write('<scri' + 'pt>window.onload = function(){var em = parent.jQuery("#' + randomID + '")[0];window.onresize = function(){if(parent.jQuery.onFontResize){parent.jQuery.onFontResize.trigger(em.offsetWidth / 100);}}};</scri' + 'pt>');
            doc.close();
        }
        jQuery.onFontResize.initialSize = resizeFrame[0].offsetWidth / 100;
    });
    return {
        // public method, so it can be called from within the iframe
        trigger: function (em) {
            $(window).trigger("fontresize", [em]);
        }
    };
}(jQuery));
// clear inputs on focus
function initInputs() {
    PlaceholderInput.replaceByOptions({
        // filter options
        clearInputs: true,
        clearTextareas: true,
        clearPasswords: true,
        skipClass:'default',

        // input options
        showPasswordBullets: false,
        wrapWithElement: false,
        showUntilTyping: false,
        getParentByClass: false,
        placeholderAttr: 'placeholder'
    });
}
function initDropDown()
{
    var nav = document.getElementById("nav");
    if(nav) {
        var lis = nav.getElementsByTagName("li");
        for (var i=0; i<lis.length; i++) {
            if(lis[i].getElementsByTagName("ul").length > 0) {
                lis[i].className += " has-drop-down"
                lis[i].getElementsByTagName("a")[0].className += " has-drop-down-a"
            }
            lis[i].onmouseover = function() {
                this.className += " hover";
            }
            lis[i].onmouseout = function() {
                this.className = this.className.replace(" hover", "");
            }
        }
    }
}
// placeholder class
;(function(){
    var placeholderCollection = [];
    PlaceholderInput = function() {
        this.options = {
            element:null,
            showUntilTyping:false,
            wrapWithElement:false,
            getParentByClass:false,
            showPasswordBullets:false,
            placeholderAttr:'value',
            inputFocusClass:'focus',
            inputActiveClass:'text-active',
            parentFocusClass:'parent-focus',
            parentActiveClass:'parent-active',
            labelFocusClass:'label-focus',
            labelActiveClass:'label-active',
            fakeElementClass:'input-placeholder-text'
        }
        placeholderCollection.push(this);
        this.init.apply(this,arguments);
    }
    PlaceholderInput.refreshAllInputs = function(except) {
        for(var i = 0; i < placeholderCollection.length; i++) {
            if(except !== placeholderCollection[i]) {
                placeholderCollection[i].refreshState();
            }
        }
    }
    PlaceholderInput.replaceByOptions = function(opt) {
        var inputs = [].concat(
            convertToArray(document.getElementsByTagName('input')),
            convertToArray(document.getElementsByTagName('textarea'))
        );
        for(var i = 0; i < inputs.length; i++) {
            if(inputs[i].className.indexOf(opt.skipClass) < 0) {
                var inputType = getInputType(inputs[i]);
                if((opt.clearInputs && (inputType === 'text' || inputType === 'email')) ||
                    (opt.clearTextareas && inputType === 'textarea') ||
                    (opt.clearPasswords && inputType === 'password')
                ) {
                    new PlaceholderInput({
                        element:inputs[i],
                        wrapWithElement:opt.wrapWithElement,
                        showUntilTyping:opt.showUntilTyping,
                        getParentByClass:opt.getParentByClass,
                        showPasswordBullets:opt.showPasswordBullets,
                        placeholderAttr: inputs[i].getAttribute('placeholder') ? 'placeholder' : opt.placeholderAttr
                    });
                }
            }
        }
    }
    PlaceholderInput.prototype = {
        init: function(opt) {
            this.setOptions(opt);
            if(this.element && this.element.PlaceholderInst) {
                this.element.PlaceholderInst.refreshClasses();
            } else {
                this.element.PlaceholderInst = this;
                if(this.elementType !== 'radio' || this.elementType !== 'checkbox' || this.elementType !== 'file') {
                    this.initElements();
                    this.attachEvents();
                    this.refreshClasses();
                }
            }
        },
        setOptions: function(opt) {
            for(var p in opt) {
                if(opt.hasOwnProperty(p)) {
                    this.options[p] = opt[p];
                }
            }
            if(this.options.element) {
                this.element = this.options.element;
                this.elementType = getInputType(this.element);
                this.wrapWithElement = (this.elementType === 'password' || this.options.showUntilTyping ? true : this.options.wrapWithElement);
                if(this.options.showPasswordBullets && this.elementType === 'password') {
                    this.wrapWithElement = false;
                }
                this.setPlaceholderValue(this.options.placeholderAttr);
            }
        },
        setPlaceholderValue: function(attr) {
            this.origValue = (attr === 'value' ? this.element.defaultValue : (this.element.getAttribute(attr) || ''));
            if(this.options.placeholderAttr !== 'value') {
                this.element.removeAttribute(this.options.placeholderAttr);
            }
        },
        initElements: function() {
            // create fake element if needed
            if(this.wrapWithElement) {
                this.fakeElement = document.createElement('span');
                this.fakeElement.className = this.options.fakeElementClass;
                this.fakeElement.innerHTML += this.origValue;
                this.fakeElement.style.color = getStyle(this.element, 'color');
                this.fakeElement.style.position = 'absolute';
                this.element.parentNode.insertBefore(this.fakeElement, this.element);

                if(this.element.value === this.origValue || !this.element.value) {
                    this.element.value = '';
                    this.togglePlaceholderText(true);
                } else {
                    this.togglePlaceholderText(false);
                }
            } else if(!this.element.value && this.origValue.length) {
                this.element.value = this.origValue;
            }
            // get input label
            if(this.element.id) {
                this.labels = document.getElementsByTagName('label');
                for(var i = 0; i < this.labels.length; i++) {
                    if(this.labels[i].htmlFor === this.element.id) {
                        this.labelFor = this.labels[i];
                        break;
                    }
                }
            }
            // get parent node (or parentNode by className)
            this.elementParent = this.element.parentNode;
            if(typeof this.options.getParentByClass === 'string') {
                var el = this.element;
                while(el.parentNode) {
                    if(hasClass(el.parentNode, this.options.getParentByClass)) {
                        this.elementParent = el.parentNode;
                        break;
                    } else {
                        el = el.parentNode;
                    }
                }
            }
        },
        attachEvents: function() {
            this.element.onfocus = bindScope(this.focusHandler, this);
            this.element.onblur = bindScope(this.blurHandler, this);
            if(this.options.showUntilTyping) {
                this.element.onkeydown = bindScope(this.typingHandler, this);
                this.element.onpaste = bindScope(this.typingHandler, this);
            }
            if(this.wrapWithElement) this.fakeElement.onclick = bindScope(this.focusSetter, this);
        },
        togglePlaceholderText: function(state) {
            if(this.wrapWithElement) {
                this.fakeElement.style.display = state ? '' : 'none';
            } else {
                this.element.value = state ? this.origValue : '';
            }
        },
        focusSetter: function() {
            this.element.focus();
        },
        focusHandler: function() {
            clearInterval(this.checkerInterval);
            this.checkerInterval = setInterval(bindScope(this.intervalHandler,this), 1);
            this.focused = true;
            if(!this.element.value.length || this.element.value === this.origValue) {
                if(!this.options.showUntilTyping) {
                    this.togglePlaceholderText(false);
                }
            }
            this.refreshClasses();
        },
        blurHandler: function() {
            clearInterval(this.checkerInterval);
            this.focused = false;
            if(!this.element.value.length || this.element.value === this.origValue) {
                this.togglePlaceholderText(true);
            }
            this.refreshClasses();
            PlaceholderInput.refreshAllInputs(this);
        },
        typingHandler: function() {
            setTimeout(bindScope(function(){
                if(this.element.value.length) {
                    this.togglePlaceholderText(false);
                    this.refreshClasses();
                }
            },this), 10);
        },
        intervalHandler: function() {
            if(typeof this.tmpValue === 'undefined') {
                this.tmpValue = this.element.value;
            }
            if(this.tmpValue != this.element.value) {
                PlaceholderInput.refreshAllInputs(this);
            }
        },
        refreshState: function() {
            if(this.wrapWithElement) {
                if(this.element.value.length && this.element.value !== this.origValue) {
                    this.togglePlaceholderText(false);
                } else if(!this.element.value.length) {
                    this.togglePlaceholderText(true);
                }
            }
            this.refreshClasses();
        },
        refreshClasses: function() {
            this.textActive = this.focused || (this.element.value.length && this.element.value !== this.origValue);
            this.setStateClass(this.element, this.options.inputFocusClass,this.focused);
            this.setStateClass(this.elementParent, this.options.parentFocusClass,this.focused);
            this.setStateClass(this.labelFor, this.options.labelFocusClass,this.focused);
            this.setStateClass(this.element, this.options.inputActiveClass, this.textActive);
            this.setStateClass(this.elementParent, this.options.parentActiveClass, this.textActive);
            this.setStateClass(this.labelFor, this.options.labelActiveClass, this.textActive);
        },
        setStateClass: function(el,cls,state) {
            if(!el) return; else if(state) addClass(el,cls); else removeClass(el,cls);
        }
    }

    // utility functions
    function convertToArray(collection) {
        var arr = [];
        for (var i = 0, ref = arr.length = collection.length; i < ref; i++) {
            arr[i] = collection[i];
        }
        return arr;
    }
    function getInputType(input) {
        return (input.type ? input.type : input.tagName).toLowerCase();
    }
    function hasClass(el,cls) {
        return el.className ? el.className.match(new RegExp('(\\s|^)'+cls+'(\\s|$)')) : false;
    }
    function addClass(el,cls) {
        if (!hasClass(el,cls)) el.className += " "+cls;
    }
    function removeClass(el,cls) {
        if (hasClass(el,cls)) {el.className=el.className.replace(new RegExp('(\\s|^)'+cls+'(\\s|$)'),' ');}
    }
    function bindScope(f, scope) {
        return function() {return f.apply(scope, arguments)}
    }
    function getStyle(el, prop) {
        if (document.defaultView && document.defaultView.getComputedStyle) {
            return document.defaultView.getComputedStyle(el, null)[prop];
        } else if (el.currentStyle) {
            return el.currentStyle[prop];
        } else {
            return el.style[prop];
        }
    }
}());
// page init
function initNavFix() {
    new touchNav({
        navBlock: 'nav' // String id or DOM-object
    });
}

if (window.addEventListener) window.addEventListener("load", initNavFix, false);
else if (window.attachEvent) window.attachEvent("onload", initNavFix);

// navigation accesibility module
function touchNav(opt) {
    this.options = {
        hoverClass: 'hover',
        menuItems: 'li',
        menuOpener: 'a',
        menuDrop: 'ul',
        navBlock: null
    }
    for(var p in opt) {
        if(opt.hasOwnProperty(p)) {
            this.options[p] = opt[p];
        }
    }
    this.init();
}
touchNav.prototype = {
    init: function() {
        if(typeof this.options.navBlock === 'string') {
            this.menu = document.getElementById(this.options.navBlock);
        } else if(typeof this.options.navBlock === 'object') {
            this.menu = this.options.navBlock;
        }
        if(this.menu) {
            this.getElements();
            this.addEvents();
        }
    },
    getElements: function() {
        this.menuItems = this.menu.getElementsByTagName(this.options.menuItems);
    },
    getOpener: function(obj) {
        for(var i = 0; i < obj.childNodes.length; i++) {
            if(obj.childNodes[i].tagName && obj.childNodes[i].tagName.toLowerCase() == this.options.menuOpener.toLowerCase()) {
                return obj.childNodes[i];
            }
        }
        return false;
    },
    getDrop: function(obj) {
        for(var i = 0; i < obj.childNodes.length; i++) {
            if(obj.childNodes[i].tagName && obj.childNodes[i].tagName.toLowerCase() == this.options.menuDrop.toLowerCase()) {
                return obj.childNodes[i];
            }
        }
        return false;
    },
    addEvents: function() {
        // attach event handlers
        this.preventCurrentClick = true;
        for(var i = 0; i < this.menuItems.length; i++) {
            this.bind(function(i){
                var item = this.menuItems[i];
                // only for touch input devices
                if(this.isTouchDevice && this.getDrop(item)) {
                    this.addHandler(this.getOpener(item), 'click', this.bind(this.clickHandler));
                    this.addHandler(this.getOpener(item), 'touchstart', this.bind(function(){
                        this.currentItem = item;
                        this.currentLink = this.getOpener(item);
                        this.pressHandler.apply(this, arguments);
                    }));
                }
                // for desktop computers and touch devices
                this.addHandler(item, 'mouseover', this.bind(function(){
                    this.currentItem = item;
                    this.mouseoverHandler();
                }));
                this.addHandler(item, 'mouseout', this.bind(function(){
                    this.currentItem = item;
                    this.mouseoutHandler();
                }));
            })(i);
        }
        // hide dropdowns when clicking outside navigation
        if(this.isTouchDevice) {
            this.addHandler(document, 'touchstart', this.bind(this.clickOutsideHandler));
        }
    },
    mouseoverHandler: function() {
        this.addClass(this.currentItem, this.options.hoverClass);
    },
    mouseoutHandler: function() {
        this.removeClass(this.currentItem, this.options.hoverClass);
    },
    hideActiveDropdown: function() {
        for(var i = 0; i < this.menuItems.length; i++) {
            this.removeClass(this.menuItems[i], this.options.hoverClass);
        }
        this.activeParent = null;
    },
    pressHandler: function(e) {
        // hide previous drop (if active)
        if(this.currentItem != this.activeParent && !this.isParent(this.activeParent, this.currentLink)) {
            this.hideActiveDropdown();
        }
        // handle current drop
        this.activeParent = this.currentItem;
        if(this.hasClass(this.currentItem, this.options.hoverClass)) {
            this.preventCurrentClick = false;
        } else {
            this.preventEvent(e);
            this.preventCurrentClick = true;
            this.addClass(this.currentItem, this.options.hoverClass);
        }
    },
    clickHandler: function(e) {
        // prevent first click on link
        if(this.preventCurrentClick) {
            this.preventEvent(e);
        }
    },
    clickOutsideHandler: function(event) {
        var e = event.changedTouches ? event.changedTouches[0] : event;
        if(this.activeParent && !this.isParent(this.menu, e.target)) {
            this.hideActiveDropdown();
        }
    },
    preventEvent: function(e) {
        if(!e) e = window.event;
        if(e.preventDefault) e.preventDefault();
        e.returnValue = false;
    },
    isParent: function(parent, child) {
        while(child.parentNode) {
            if(child.parentNode == parent) {
                return true;
            }
            child = child.parentNode;
        }
        return false;
    },
    isTouchDevice: (function() {
        try {
            return (('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) || navigator.userAgent.indexOf('IEMobile') != -1;
        } catch (e) {
            return false;
        }
    }()),
    addHandler: function(object, event, handler) {
        if (object.addEventListener) object.addEventListener(event, handler, false);
        else if (object.attachEvent) object.attachEvent('on' + event, handler);
    },
    removeHandler: function(object, event, handler) {
        if (object.removeEventListener) object.removeEventListener(event, handler, false);
        else if (object.detachEvent) object.detachEvent('on' + event, handler);
    },
    hasClass: function(obj,cname) {
        return (obj.className ? obj.className.match(new RegExp('(\\s|^)'+cname+'(\\s|$)')) : false);
    },
    addClass: function(obj,cname) {
        if (!this.hasClass(obj,cname)) obj.className += " "+cname;
    },
    removeClass: function(obj,cname) {
        if (this.hasClass(obj,cname)) obj.className=obj.className.replace(new RegExp('(\\s|^)'+cname+'(\\s|$)'),' ');
    },
    bind: function(func, scope){
        var newScope = scope || this;
        return function() {
            return func.apply(newScope, arguments);
        }
    }
}
/*
 * JavaScript Custom Forms 1.4.1
 */
jcf = {
    // global options
    modules: {},
    plugins: {},
    baseOptions: {
        useNativeDropOnMobileDevices: true,
        unselectableClass:'jcf-unselectable',
        labelActiveClass:'jcf-label-active',
        labelDisabledClass:'jcf-label-disabled',
        classPrefix: 'jcf-class-',
        hiddenClass:'jcf-hidden',
        focusClass:'jcf-focus',
        wrapperTag: 'div'
    },
    // replacer function
    customForms: {
        setOptions: function(obj) {
            for(var p in obj) {
                if(obj.hasOwnProperty(p) && typeof obj[p] === 'object') {
                    jcf.lib.extend(jcf.modules[p].prototype.defaultOptions, obj[p]);
                }
            }
        },
        replaceAll: function() {
            for(var k in jcf.modules) {
                var els = jcf.lib.queryBySelector(jcf.modules[k].prototype.selector);
                for(var i = 0; i<els.length; i++) {
                    if(els[i].jcf) {
                        // refresh form element state
                        els[i].jcf.refreshState();
                    } else {
                        // replace form element
                        if(!jcf.lib.hasClass(els[i], 'default') && jcf.modules[k].prototype.checkElement(els[i])) {
                            new jcf.modules[k]({
                                replaces:els[i]
                            });
                        }
                    }
                }
            }
        },
        refreshAll: function() {
            for(var k in jcf.modules) {
                var els = jcf.lib.queryBySelector(jcf.modules[k].prototype.selector);
                for(var i = 0; i<els.length; i++) {
                    if(els[i].jcf) {
                        // refresh form element state
                        els[i].jcf.refreshState();
                    }
                }
            }
        },
        refreshElement: function(obj) {
            if(obj && obj.jcf) {
                obj.jcf.refreshState();
            }
        },
        destroyAll: function() {
            for(var k in jcf.modules) {
                var els = jcf.lib.queryBySelector(jcf.modules[k].prototype.selector);
                for(var i = 0; i<els.length; i++) {
                    if(els[i].jcf) {
                        els[i].jcf.destroy();
                    }
                }
            }
        }
    },
    // detect device type
    isTouchDevice: (function() {
        try {
            return ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch;
        } catch (e) {
            return false;
        }
    }()),
    // define base module
    setBaseModule: function(obj) {
        jcf.customControl = function(opt){
            this.options = jcf.lib.extend({}, jcf.baseOptions, this.defaultOptions, opt);
            this.init();
        }
        for(var p in obj) {
            jcf.customControl.prototype[p] = obj[p];
        }
    },
    // add module to jcf.modules
    addModule: function(obj) {
        if(obj.name){
            // create new module proto class
            jcf.modules[obj.name] = function(){
                jcf.modules[obj.name].superclass.constructor.apply(this, arguments);
            }
            jcf.lib.inherit(jcf.modules[obj.name], jcf.customControl);
            for(var p in obj) {
                jcf.modules[obj.name].prototype[p] = obj[p]
            }
            // on create module
            jcf.modules[obj.name].prototype.onCreateModule();
            // make callback for exciting modules
            for(var mod in jcf.modules) {
                if(jcf.modules[mod] != jcf.modules[obj.name]) {
                    jcf.modules[mod].prototype.onModuleAdded(jcf.modules[obj.name]);
                }
            }
        }
    },
    // add plugin to jcf.plugins
    addPlugin: function(obj) {
        if(obj && obj.name) {
            jcf.plugins[obj.name] = function() {
                this.init.apply(this, arguments);
            }
            for(var p in obj) {
                jcf.plugins[obj.name].prototype[p] = obj[p];
            }
        }
    },
    // miscellaneous init
    init: function(){
        this.eventPress = this.isTouchDevice ? 'touchstart' : 'mousedown';
        this.eventMove = this.isTouchDevice ? 'touchmove' : 'mousemove';
        this.eventRelease = this.isTouchDevice ? 'touchend' : 'mouseup';
        return this;
    },
    initStyles: function() {
        // create <style> element and rules
        var head = document.getElementsByTagName('head')[0],
            style = document.createElement('style'),
            rules = document.createTextNode('.'+jcf.baseOptions.unselectableClass+'{'+
                '-moz-user-select:none;'+
                '-webkit-tap-highlight-color:rgba(255,255,255,0);'+
                '-webkit-user-select:none;'+
                'user-select:none;'+
            '}');

        // append style element
        style.type = 'text/css';
        if(style.styleSheet) {
            style.styleSheet.cssText = rules.nodeValue;
        } else {
            style.appendChild(rules);
        }
        head.appendChild(style);
    }
}.init();

/*
 * Custom Form Control prototype
 */
jcf.setBaseModule({
    init: function(){
        if(this.options.replaces) {
            this.realElement = this.options.replaces;
            this.realElement.jcf = this;
            this.replaceObject();
        }
    },
    defaultOptions: {
        // default module options (will be merged with base options)
    },
    checkElement: function(el){
        return true; // additional check for correct form element
    },
    replaceObject: function(){
        this.createWrapper();
        this.attachEvents();
        this.fixStyles();
        this.setupWrapper();
    },
    createWrapper: function(){
        this.fakeElement = jcf.lib.createElement(this.options.wrapperTag);
        this.labelFor = jcf.lib.getLabelFor(this.realElement);
        jcf.lib.disableTextSelection(this.fakeElement);
        jcf.lib.addClass(this.fakeElement, jcf.lib.getAllClasses(this.realElement.className, this.options.classPrefix));
        jcf.lib.addClass(this.realElement, jcf.baseOptions.hiddenClass);
    },
    attachEvents: function(){
        jcf.lib.event.add(this.realElement, 'focus', this.onFocusHandler, this);
        jcf.lib.event.add(this.realElement, 'blur', this.onBlurHandler, this);
        jcf.lib.event.add(this.fakeElement, 'click', this.onFakeClick, this);
        jcf.lib.event.add(this.fakeElement, jcf.eventPress, this.onFakePressed, this);
        jcf.lib.event.add(this.fakeElement, jcf.eventRelease, this.onFakeReleased, this);

        if(this.labelFor) {
            this.labelFor.jcf = this;
            jcf.lib.event.add(this.labelFor, 'click', this.onFakeClick, this);
            jcf.lib.event.add(this.labelFor, jcf.eventPress, this.onFakePressed, this);
            jcf.lib.event.add(this.labelFor, jcf.eventRelease, this.onFakeReleased, this);
        }
    },
    fixStyles: function() {
        // hide mobile webkit tap effect
        if(jcf.isTouchDevice) {
            var tapStyle = 'rgba(255,255,255,0)';
            this.realElement.style.webkitTapHighlightColor = tapStyle;
            this.fakeElement.style.webkitTapHighlightColor = tapStyle;
            if(this.labelFor) {
                this.labelFor.style.webkitTapHighlightColor = tapStyle;
            }
        }
    },
    setupWrapper: function(){
        // implement in subclass
    },
    refreshState: function(){
        // implement in subclass
    },
    destroy: function() {
        if(this.fakeElement && this.fakeElement.parentNode) {
            this.fakeElement.parentNode.removeChild(this.fakeElement);
        }
        jcf.lib.removeClass(this.realElement, jcf.baseOptions.hiddenClass);
        this.realElement.jcf = null;
    },
    onFocus: function(){
        // emulated focus event
        jcf.lib.addClass(this.fakeElement,this.options.focusClass);
    },
    onBlur: function(cb){
        // emulated blur event
        jcf.lib.removeClass(this.fakeElement,this.options.focusClass);
    },
    onFocusHandler: function() {
        // handle focus loses
        if(this.focused) return;
        this.focused = true;

        // handle touch devices also
        if(jcf.isTouchDevice) {
            if(jcf.focusedInstance && jcf.focusedInstance.realElement != this.realElement) {
                jcf.focusedInstance.onBlur();
                jcf.focusedInstance.realElement.blur();
            }
            jcf.focusedInstance = this;
        }
        this.onFocus.apply(this, arguments);
    },
    onBlurHandler: function() {
        // handle focus loses
        if(!this.pressedFlag) {
            this.focused = false;
            this.onBlur.apply(this, arguments);
        }
    },
    onFakeClick: function(){
        if(jcf.isTouchDevice) {
            this.onFocus();
        } else if(!this.realElement.disabled) {
            this.realElement.focus();
        }
    },
    onFakePressed: function(e){
        this.pressedFlag = true;
    },
    onFakeReleased: function(){
        this.pressedFlag = false;
    },
    onCreateModule: function(){
        // implement in subclass
    },
    onModuleAdded: function(module) {
        // implement in subclass
    },
    onControlReady: function() {
        // implement in subclass
    }
});

/*
 * JCF Utility Library
 */
jcf.lib = {
    bind: function(func, scope){
        return function() {
            return func.apply(scope, arguments);
        }
    },
    browser: (function() {
        var ua = navigator.userAgent.toLowerCase(), res = {},
        match = /(webkit)[ \/]([\w.]+)/.exec(ua) || /(opera)(?:.*version)?[ \/]([\w.]+)/.exec(ua) ||
                /(msie) ([\w.]+)/.exec(ua) || ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+))?/.exec(ua) || [];
        res[match[1]] = true;
        res.version = match[2] || "0";
        res.safariMac = ua.indexOf('mac') != -1 && ua.indexOf('safari') != -1;
        return res;
    })(),
    getOffset: function (obj) {
        if (obj.getBoundingClientRect) {
            var scrollLeft = window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft;
            var scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
            var clientLeft = document.documentElement.clientLeft || document.body.clientLeft || 0;
            var clientTop = document.documentElement.clientTop || document.body.clientTop || 0;
            return {
                top:Math.round(obj.getBoundingClientRect().top + scrollTop - clientTop),
                left:Math.round(obj.getBoundingClientRect().left + scrollLeft - clientLeft)
            }
        } else {
            var posLeft = 0, posTop = 0;
            while (obj.offsetParent) {posLeft += obj.offsetLeft; posTop += obj.offsetTop; obj = obj.offsetParent;}
            return {top:posTop,left:posLeft};
        }
    },
    getScrollTop: function() {
        return window.pageYOffset || document.documentElement.scrollTop;
    },
    getScrollLeft: function() {
        return window.pageXOffset || document.documentElement.scrollLeft;
    },
    getWindowWidth: function(){
        return document.compatMode=='CSS1Compat' ? document.documentElement.clientWidth : document.body.clientWidth;
    },
    getWindowHeight: function(){
        return document.compatMode=='CSS1Compat' ? document.documentElement.clientHeight : document.body.clientHeight;
    },
    getStyle: function(el, prop) {
        if (document.defaultView && document.defaultView.getComputedStyle) {
            return document.defaultView.getComputedStyle(el, null)[prop];
        } else if (el.currentStyle) {
            return el.currentStyle[prop];
        } else {
            return el.style[prop];
        }
    },
    getParent: function(obj, selector) {
        while(obj.parentNode && obj.parentNode != document.body) {
            if(obj.parentNode.tagName.toLowerCase() == selector.toLowerCase()) {
                return obj.parentNode;
            }
            obj = obj.parentNode;
        }
        return false;
    },
    isParent: function(child, parent) {
        while(child.parentNode) {
            if(child.parentNode === parent) {
                return true;
            }
            child = child.parentNode;
        }
        return false;
    },
    getLabelFor: function(object) {
        if(jcf.lib.getParent(object,'label')) {
            return object.parentNode;
        } else if(object.id) {
            return jcf.lib.queryBySelector('label[for="' + object.id + '"]')[0];
        }
    },
    disableTextSelection: function(el){
        if (typeof el.onselectstart !== 'undefined') {
            el.onselectstart = function() {return false};
        } else if(window.opera) {
            el.setAttribute('unselectable', 'on');
        } else {
            jcf.lib.addClass(el, jcf.baseOptions.unselectableClass);
        }
    },
    enableTextSelection: function(el) {
        if (typeof el.onselectstart !== 'undefined') {
            el.onselectstart = null;
        } else if(window.opera) {
            el.removeAttribute('unselectable');
        } else {
            jcf.lib.removeClass(el, jcf.baseOptions.unselectableClass);
        }
    },
    queryBySelector: function(selector, scope){
        return this.getElementsBySelector(selector, scope);
    },
    prevSibling: function(node) {
        while(node = node.previousSibling) if(node.nodeType == 1) break;
        return node;
    },
    nextSibling: function(node) {
        while(node = node.nextSibling) if(node.nodeType == 1) break;
        return node;
    },
    fireEvent: function(element,event) {
        if (document.createEventObject){
            var evt = document.createEventObject();
            return element.fireEvent('on'+event,evt)
        }
        else{
            var evt = document.createEvent('HTMLEvents');
            evt.initEvent(event, true, true );
            return !element.dispatchEvent(evt);
        }
    },
    isParent: function(p, c) {
        while(c.parentNode) {
            if(p == c) {
                return true;
            }
            c = c.parentNode;
        }
        return false;
    },
    inherit: function(Child, Parent) {
        var F = function() { }
        F.prototype = Parent.prototype
        Child.prototype = new F()
        Child.prototype.constructor = Child
        Child.superclass = Parent.prototype
    },
    extend: function(obj) {
        for(var i = 1; i < arguments.length; i++) {
            for(var p in arguments[i]) {
                if(arguments[i].hasOwnProperty(p)) {
                    obj[p] = arguments[i][p];
                }
            }
        }
        return obj;
    },
    hasClass: function (obj,cname) {
        return (obj.className ? obj.className.match(new RegExp('(\\s|^)'+cname+'(\\s|$)')) : false);
    },
    addClass: function (obj,cname) {
        if (!this.hasClass(obj,cname)) obj.className += (!obj.className.length || obj.className.charAt(obj.className.length - 1) === ' ' ? '' : ' ') + cname;
    },
    removeClass: function (obj,cname) {
        if (this.hasClass(obj,cname)) obj.className=obj.className.replace(new RegExp('(\\s|^)'+cname+'(\\s|$)'),' ').replace(/\s+$/, '');
    },
    toggleClass: function(obj, cname, condition) {
        if(condition) this.addClass(obj, cname); else this.removeClass(obj, cname);
    },
    createElement: function(tagName, options) {
        var el = document.createElement(tagName);
        for(var p in options) {
            if(options.hasOwnProperty(p)) {
                switch (p) {
                    case 'class': el.className = options[p]; break;
                    case 'html': el.innerHTML = options[p]; break;
                    case 'style': this.setStyles(el, options[p]); break;
                    default: el.setAttribute(p, options[p]);
                }
            }
        }
        return el;
    },
    setStyles: function(el, styles) {
        for(var p in styles) {
            if(styles.hasOwnProperty(p)) {
                switch (p) {
                    case 'float': el.style.cssFloat = styles[p]; break;
                    case 'opacity': el.style.filter = 'progid:DXImageTransform.Microsoft.Alpha(opacity='+styles[p]*100+')'; el.style.opacity = styles[p]; break;
                    default: el.style[p] = (typeof styles[p] === 'undefined' ? 0 : styles[p]) + (typeof styles[p] === 'number' ? 'px' : '');
                }
            }
        }
        return el;
    },
    getInnerWidth: function(el) {
        return el.offsetWidth - (parseInt(this.getStyle(el,'paddingLeft')) || 0) - (parseInt(this.getStyle(el,'paddingRight')) || 0);
    },
    getInnerHeight: function(el) {
        return el.offsetHeight - (parseInt(this.getStyle(el,'paddingTop')) || 0) - (parseInt(this.getStyle(el,'paddingBottom')) || 0);
    },
    getAllClasses: function(cname, prefix, skip) {
        if(!skip) skip = '';
        if(!prefix) prefix = '';
        return cname ? cname.replace(new RegExp('(\\s|^)'+skip+'(\\s|$)'),' ').replace(/[\s]*([\S]+)+[\s]*/gi,prefix+"$1 ") : '';
    },
    getElementsBySelector: function(selector, scope) {
        if(typeof document.querySelectorAll === 'function') {
            return (scope || document).querySelectorAll(selector);
        }
        var selectors = selector.split(',');
        var resultList = [];
        for(var s = 0; s < selectors.length; s++) {
            var currentContext = [scope || document];
            var tokens = selectors[s].replace(/^\s+/,'').replace(/\s+$/,'').split(' ');
            for (var i = 0; i < tokens.length; i++) {
                token = tokens[i].replace(/^\s+/,'').replace(/\s+$/,'');
                if (token.indexOf('#') > -1) {
                    var bits = token.split('#'), tagName = bits[0], id = bits[1];
                    var element = document.getElementById(id);
                    if (tagName && element.nodeName.toLowerCase() != tagName) {
                        return [];
                    }
                    currentContext = [element];
                    continue;
                }
                if (token.indexOf('.') > -1) {
                    var bits = token.split('.'), tagName = bits[0] || '*', className = bits[1], found = [], foundCount = 0;
                    for (var h = 0; h < currentContext.length; h++) {
                        var elements;
                        if (tagName == '*') {
                            elements = currentContext[h].getElementsByTagName('*');
                        } else {
                            elements = currentContext[h].getElementsByTagName(tagName);
                        }
                        for (var j = 0; j < elements.length; j++) {
                            found[foundCount++] = elements[j];
                        }
                    }
                    currentContext = [];
                    var currentContextIndex = 0;
                    for (var k = 0; k < found.length; k++) {
                        if (found[k].className && found[k].className.match(new RegExp('(\\s|^)'+className+'(\\s|$)'))) {
                            currentContext[currentContextIndex++] = found[k];
                        }
                    }
                    continue;
                }
                if (token.match(/^(\w*)\[(\w+)([=~\|\^\$\*]?)=?"?([^\]"]*)"?\]$/)) {
                    var tagName = RegExp.$1 || '*', attrName = RegExp.$2, attrOperator = RegExp.$3, attrValue = RegExp.$4;
                    if(attrName.toLowerCase() == 'for' && this.browser.msie && this.browser.version < 8) {
                        attrName = 'htmlFor';
                    }
                    var found = [], foundCount = 0;
                    for (var h = 0; h < currentContext.length; h++) {
                        var elements;
                        if (tagName == '*') {
                            elements = currentContext[h].getElementsByTagName('*');
                        } else {
                            elements = currentContext[h].getElementsByTagName(tagName);
                        }
                        for (var j = 0; elements[j]; j++) {
                            found[foundCount++] = elements[j];
                        }
                    }
                    currentContext = [];
                    var currentContextIndex = 0, checkFunction;
                    switch (attrOperator) {
                        case '=': checkFunction = function(e) { return (e.getAttribute(attrName) == attrValue) }; break;
                        case '~': checkFunction = function(e) { return (e.getAttribute(attrName).match(new RegExp('(\\s|^)'+attrValue+'(\\s|$)'))) }; break;
                        case '|': checkFunction = function(e) { return (e.getAttribute(attrName).match(new RegExp('^'+attrValue+'-?'))) }; break;
                        case '^': checkFunction = function(e) { return (e.getAttribute(attrName).indexOf(attrValue) == 0) }; break;
                        case '$': checkFunction = function(e) { return (e.getAttribute(attrName).lastIndexOf(attrValue) == e.getAttribute(attrName).length - attrValue.length) }; break;
                        case '*': checkFunction = function(e) { return (e.getAttribute(attrName).indexOf(attrValue) > -1) }; break;
                        default : checkFunction = function(e) { return e.getAttribute(attrName) };
                    }
                    currentContext = [];
                    var currentContextIndex = 0;
                    for (var k = 0; k < found.length; k++) {
                        if (checkFunction(found[k])) {
                            currentContext[currentContextIndex++] = found[k];
                        }
                    }
                    continue;
                }
                tagName = token;
                var found = [], foundCount = 0;
                for (var h = 0; h < currentContext.length; h++) {
                    var elements = currentContext[h].getElementsByTagName(tagName);
                    for (var j = 0; j < elements.length; j++) {
                        found[foundCount++] = elements[j];
                    }
                }
                currentContext = found;
            }
            resultList = [].concat(resultList,currentContext);
        }
        return resultList;
    },
    scrollSize: (function(){
        var content, hold, sizeBefore, sizeAfter;
        function buildSizer(){
            if(hold) removeSizer();
            content = document.createElement('div');
            hold = document.createElement('div');
            hold.style.cssText = 'position:absolute;overflow:hidden;width:100px;height:100px';
            hold.appendChild(content);
            document.body.appendChild(hold);
        }
        function removeSizer(){
            document.body.removeChild(hold);
            hold = null;
        }
        function calcSize(vertical) {
            buildSizer();
            content.style.cssText = 'height:'+(vertical ? '100%' : '200px');
            sizeBefore = (vertical ? content.offsetHeight : content.offsetWidth);
            hold.style.overflow = 'scroll'; content.innerHTML = 1;
            sizeAfter = (vertical ? content.offsetHeight : content.offsetWidth);
            if(vertical && hold.clientHeight) sizeAfter = hold.clientHeight;
            removeSizer();
            return sizeBefore - sizeAfter;
        }
        return {
            getWidth:function(){
                return calcSize(false);
            },
            getHeight:function(){
                return calcSize(true)
            }
        }
    }()),
    domReady: function (handler){
        var called = false
        function ready() {
            if (called) return;
            called = true;
            handler();
        }
        if (document.addEventListener) {
            document.addEventListener("DOMContentLoaded", ready, false);
        } else if (document.attachEvent) {
            if (document.documentElement.doScroll && window == window.top) {
                function tryScroll(){
                    if (called) return
                    if (!document.body) return
                    try {
                        document.documentElement.doScroll("left")
                        ready()
                    } catch(e) {
                        setTimeout(tryScroll, 0)
                    }
                }
                tryScroll()
            }
            document.attachEvent("onreadystatechange", function(){
                if (document.readyState === "complete") {
                    ready()
                }
            })
        }
        if (window.addEventListener) window.addEventListener('load', ready, false)
        else if (window.attachEvent) window.attachEvent('onload', ready)
    },
    event: (function(){
        var guid = 0;
        function fixEvent(e) {
            e = e || window.event;
            if (e.isFixed) {
                return e;
            }
            e.isFixed = true;
            e.preventDefault = e.preventDefault || function(){this.returnValue = false}
            e.stopPropagation = e.stopPropagaton || function(){this.cancelBubble = true}
            if (!e.target) {
                e.target = e.srcElement
            }
            if (!e.relatedTarget && e.fromElement) {
                e.relatedTarget = e.fromElement == e.target ? e.toElement : e.fromElement;
            }
            if (e.pageX == null && e.clientX != null) {
                var html = document.documentElement, body = document.body;
                e.pageX = e.clientX + (html && html.scrollLeft || body && body.scrollLeft || 0) - (html.clientLeft || 0);
                e.pageY = e.clientY + (html && html.scrollTop || body && body.scrollTop || 0) - (html.clientTop || 0);
            }
            if (!e.which && e.button) {
                e.which = e.button & 1 ? 1 : (e.button & 2 ? 3 : (e.button & 4 ? 2 : 0));
            }
            if(e.type === "DOMMouseScroll" || e.type === 'mousewheel') {
                e.mWheelDelta = 0;
                if (e.wheelDelta) {
                    e.mWheelDelta = e.wheelDelta/120;
                } else if (e.detail) {
                    e.mWheelDelta = -e.detail/3;
                }
            }
            return e;
        }
        function commonHandle(event, customScope) {
            event = fixEvent(event);
            var handlers = this.events[event.type];
            for (var g in handlers) {
                var handler = handlers[g];
                var ret = handler.call(customScope || this, event);
                if (ret === false) {
                    event.preventDefault()
                    event.stopPropagation()
                }
            }
        }
        var publicAPI = {
            add: function(elem, type, handler, forcedScope) {
                if (elem.setInterval && (elem != window && !elem.frameElement)) {
                    elem = window;
                }
                if (!handler.guid) {
                    handler.guid = ++guid;
                }
                if (!elem.events) {
                    elem.events = {};
                    elem.handle = function(event) {
                        return commonHandle.call(elem, event);
                    }
                }
                if (!elem.events[type]) {
                    elem.events[type] = {};
                    if (elem.addEventListener) elem.addEventListener(type, elem.handle, false);
                    else if (elem.attachEvent) elem.attachEvent("on" + type, elem.handle);
                    if(type === 'mousewheel') {
                        publicAPI.add(elem, 'DOMMouseScroll', handler, forcedScope);
                    }
                }
                var fakeHandler = jcf.lib.bind(handler, forcedScope);
                fakeHandler.guid = handler.guid;
                elem.events[type][handler.guid] = forcedScope ? fakeHandler : handler;
            },
            remove: function(elem, type, handler) {
                var handlers = elem.events && elem.events[type];
                if (!handlers) return;
                delete handlers[handler.guid];
                for(var any in handlers) return;
                if (elem.removeEventListener) elem.removeEventListener(type, elem.handle, false);
                else if (elem.detachEvent) elem.detachEvent("on" + type, elem.handle);
                delete elem.events[type];
                for (var any in elem.events) return;
                try {
                    delete elem.handle;
                    delete elem.events;
                } catch(e) {
                    if(elem.removeAttribute) {
                        elem.removeAttribute("handle");
                        elem.removeAttribute("events");
                    }
                }
                if(type === 'mousewheel') {
                    publicAPI.remove(elem, 'DOMMouseScroll', handler);
                }
            }
        }
        return publicAPI;
    }())
}

// init jcf styles
jcf.lib.domReady(function(){
    jcf.initStyles();
});
// custom select module
jcf.addModule({
    name:'select',
    selector:'select',
    defaultOptions: {
        hideDropOnScroll: true,
        showNativeDrop: false,
        handleDropPosition: true,
        selectDropPosition: 'bottom', // or 'top'
        wrapperClass:'select-area',
        focusClass:'select-focus',
        dropActiveClass:'select-active',
        selectedClass:'item-selected',
        currentSelectedClass:'current-selected',
        disabledClass:'select-disabled',
        valueSelector:'span.center',
        optGroupClass:'optgroup',
        openerSelector:'a.select-opener',
        selectStructure:'<span class="left"></span><span class="center"></span><a class="select-opener"></a>',
        classPrefix:'select-',
        dropMaxHeight: 200,
        dropFlippedClass: 'select-options-flipped',
        dropHiddenClass:'options-hidden',
        dropScrollableClass:'options-overflow',
        dropClass:'select-options',
        dropClassPrefix:'drop-',
        dropStructure:'<div class="drop-holder"><div class="drop-list"></div></div>',
        dropSelector:'div.drop-list'
    },
    checkElement: function(el){
        return (!el.size && !el.multiple);
    },
    setupWrapper: function(){
        jcf.lib.addClass(this.fakeElement, this.options.wrapperClass);
        this.realElement.parentNode.insertBefore(this.fakeElement, this.realElement);
        this.fakeElement.innerHTML = this.options.selectStructure;
        this.fakeElement.style.width = (this.realElement.offsetWidth > 0 ? this.realElement.offsetWidth + 'px' : 'auto');

        // show native drop if specified in options
        if(jcf.isTouchDevice && jcf.baseOptions.useNativeDropOnMobileDevices) {
            this.options.showNativeDrop = true;
        }
        if(this.options.showNativeDrop) {
            this.fakeElement.appendChild(this.realElement);
            jcf.lib.removeClass(this.realElement, this.options.hiddenClass);
            jcf.lib.setStyles(this.realElement, {
                top:0,
                left:0,
                margin:0,
                padding:0,
                opacity:0,
                border:'none',
                position:'absolute',
                width: jcf.lib.getInnerWidth(this.fakeElement) - 1,
                height: jcf.lib.getInnerHeight(this.fakeElement) - 1
            });
            jcf.lib.event.add(this.realElement, 'touchstart', function(){
                this.realElement.title = '';
            }, this)
        }

        // create select body
        this.opener = jcf.lib.queryBySelector(this.options.openerSelector, this.fakeElement)[0];
        this.valueText = jcf.lib.queryBySelector(this.options.valueSelector, this.fakeElement)[0];
        jcf.lib.disableTextSelection(this.valueText);
        this.opener.jcf = this;

        if(!this.options.showNativeDrop) {
            this.createDropdown();
            this.refreshState();
            this.onControlReady(this);
            this.hideDropdown(true);
        } else {
            this.refreshState();
        }
        this.addEvents();
    },
    addEvents: function(){
        if(this.options.showNativeDrop) {
            jcf.lib.event.add(this.realElement, 'click', this.onChange, this);
        } else {
            jcf.lib.event.add(this.fakeElement, 'click', this.toggleDropdown, this);
        }
        jcf.lib.event.add(this.realElement, 'change', this.onChange, this);
    },
    onFakeClick: function() {
        // do nothing (drop toggles by toggleDropdown method)
    },
    onFocus: function(){
        jcf.modules[this.name].superclass.onFocus.apply(this, arguments);
        if(!this.options.showNativeDrop) {
            // Mac Safari Fix
            if(jcf.lib.browser.safariMac) {
                this.realElement.setAttribute('size','2');
            }
            jcf.lib.event.add(this.realElement, 'keydown', this.onKeyDown, this);
            if(jcf.activeControl && jcf.activeControl != this) {
                jcf.activeControl.hideDropdown();
                jcf.activeControl = this;
            }
        }
    },
    onBlur: function(){
        if(!this.options.showNativeDrop) {
            // Mac Safari Fix
            if(jcf.lib.browser.safariMac) {
                this.realElement.removeAttribute('size');
            }
            if(!this.isActiveDrop() || !this.isOverDrop()) {
                jcf.modules[this.name].superclass.onBlur.apply(this);
                if(jcf.activeControl === this) jcf.activeControl = null;
                if(!jcf.isTouchDevice) {
                    this.hideDropdown();
                }
            }
            jcf.lib.event.remove(this.realElement, 'keydown', this.onKeyDown);
        } else {
            jcf.modules[this.name].superclass.onBlur.apply(this);
        }
    },
    onChange: function() {
        this.refreshState();
    },
    onKeyDown: function(e){
        jcf.tmpFlag = true;
        setTimeout(function(){jcf.tmpFlag = false},100);
        var context = this;
        context.keyboardFix = true;
        setTimeout(function(){
            context.refreshState();
        },10);
        if(e.keyCode == 13) {
            context.toggleDropdown.apply(context);
            return false;
        }
    },
    onResizeWindow: function(e){
        if(this.isActiveDrop()) {
            this.hideDropdown();
        }
    },
    onScrollWindow: function(e){
        if(this.options.hideDropOnScroll) {
            this.hideDropdown();
        } else if(this.isActiveDrop()) {
            this.positionDropdown();
        }
    },
    onOptionClick: function(e){
        var opener = e.target && e.target.tagName && e.target.tagName.toLowerCase() == 'li' ? e.target : jcf.lib.getParent(e.target, 'li');
        if(opener) {
            this.realElement.selectedIndex = parseInt(opener.getAttribute('rel'));
            if(jcf.isTouchDevice) {
                this.onFocus();
            } else {
                this.realElement.focus();
            }
            this.refreshState();
            this.hideDropdown();
            jcf.lib.fireEvent(this.realElement, 'change');
        }
        return false;
    },
    onClickOutside: function(e){
        if(jcf.tmpFlag) {
            jcf.tmpFlag = false;
            return;
        }
        if(!jcf.lib.isParent(this.fakeElement, e.target) && !jcf.lib.isParent(this.selectDrop, e.target)) {
            this.hideDropdown();
        }
    },
    onDropHover: function(e){
        if(!this.keyboardFix) {
            this.hoverFlag = true;
            var opener = e.target && e.target.tagName && e.target.tagName.toLowerCase() == 'li' ? e.target : jcf.lib.getParent(e.target, 'li');
            if(opener) {
                this.realElement.selectedIndex = parseInt(opener.getAttribute('rel'));
                this.refreshSelectedClass(parseInt(opener.getAttribute('rel')));
            }
        } else {
            this.keyboardFix = false;
        }
    },
    onDropLeave: function(){
        this.hoverFlag = false;
    },
    isActiveDrop: function(){
        return !jcf.lib.hasClass(this.selectDrop, this.options.dropHiddenClass);
    },
    isOverDrop: function(){
        return this.hoverFlag;
    },
    createDropdown: function(){
        // remove old dropdown if exists
        if(this.selectDrop) {
            this.selectDrop.parentNode.removeChild(this.selectDrop);
        }

        // create dropdown holder
        this.selectDrop = document.createElement('div');
        this.selectDrop.className = this.options.dropClass;
        this.selectDrop.innerHTML = this.options.dropStructure;
        jcf.lib.setStyles(this.selectDrop, {position:'absolute'});
        this.selectList = jcf.lib.queryBySelector(this.options.dropSelector,this.selectDrop)[0];
        jcf.lib.addClass(this.selectDrop, this.options.dropHiddenClass);
        document.body.appendChild(this.selectDrop);
        this.selectDrop.jcf = this;
        jcf.lib.event.add(this.selectDrop, 'click', this.onOptionClick, this);
        jcf.lib.event.add(this.selectDrop, 'mouseover', this.onDropHover, this);
        jcf.lib.event.add(this.selectDrop, 'mouseout', this.onDropLeave, this);
        this.buildDropdown();
    },
    buildDropdown: function() {
        // build select options / optgroups
        this.buildDropdownOptions();

        // position and resize dropdown
        this.positionDropdown();

        // cut dropdown if height exceedes
        this.buildDropdownScroll();
    },
    buildDropdownOptions: function() {
        this.resStructure = '';
        this.optNum = 0;
        for(var i = 0; i < this.realElement.children.length; i++) {
            this.resStructure += this.buildElement(this.realElement.children[i]) +'\n';
        }
        this.selectList.innerHTML = this.resStructure;
    },
    buildDropdownScroll: function() {
        if(this.options.dropMaxHeight) {
            if(this.selectDrop.offsetHeight > this.options.dropMaxHeight) {
                this.selectList.style.height = this.options.dropMaxHeight+'px';
                this.selectList.style.overflow = 'auto';
                this.selectList.style.overflowX = 'hidden';
                jcf.lib.addClass(this.selectDrop, this.options.dropScrollableClass);
            }
        }
        jcf.lib.addClass(this.selectDrop, jcf.lib.getAllClasses(this.realElement.className, this.options.dropClassPrefix, jcf.baseOptions.hiddenClass));
    },
    parseOptionTitle: function(optTitle) {
        return (typeof optTitle === 'string' && /\.(jpg|gif|png|bmp|jpeg)(.*)?$/i.test(optTitle)) ? optTitle : '';
    },
    buildElement: function(obj){
        // build option
        var res = '', optImage;
        if(obj.tagName.toLowerCase() == 'option') {
            if(!jcf.lib.prevSibling(obj) || jcf.lib.prevSibling(obj).tagName.toLowerCase() != 'option') {
                res += '<ul>';
            }

            optImage = this.parseOptionTitle(obj.title);
            res += '<li rel="'+(this.optNum++)+'" class="'+(obj.className? obj.className + ' ' : '')+'jcfcalc"><a href="#">'+(optImage ? '<img src="'+optImage+'" alt="" />' : '')+'<span>' + obj.innerHTML + '</span></a></li>';
            if(!jcf.lib.nextSibling(obj) || jcf.lib.nextSibling(obj).tagName.toLowerCase() != 'option') {
                res += '</ul>';
            }
            return res;
        }
        // build option group with options
        else if(obj.tagName.toLowerCase() == 'optgroup' && obj.label) {
            res += '<div class="'+this.options.optGroupClass+'">';
            res += '<strong class="jcfcalc"><em>'+(obj.label)+'</em></strong>';
            for(var i = 0; i < obj.children.length; i++) {
                res += this.buildElement(obj.children[i]);
            }
            res += '</div>';
            return res;
        }
    },
    positionDropdown: function(){
        var ofs = jcf.lib.getOffset(this.fakeElement), selectAreaHeight = this.fakeElement.offsetHeight, selectDropHeight = this.selectDrop.offsetHeight;
        var fitInTop = ofs.top - selectDropHeight >= jcf.lib.getScrollTop() && jcf.lib.getScrollTop() + jcf.lib.getWindowHeight() < ofs.top + selectAreaHeight + selectDropHeight;


        if((this.options.handleDropPosition && fitInTop) || this.options.selectDropPosition === 'top') {
            this.selectDrop.style.top = (ofs.top - selectDropHeight)+'px';
            jcf.lib.addClass(this.selectDrop, this.options.dropFlippedClass);
        } else {
            this.selectDrop.style.top = (ofs.top + selectAreaHeight)+'px';
            jcf.lib.removeClass(this.selectDrop, this.options.dropFlippedClass);
        }
        this.selectDrop.style.left = ofs.left+'px';
        this.selectDrop.style.width = this.fakeElement.offsetWidth+'px';
    },
    showDropdown: function(){
        document.body.appendChild(this.selectDrop);
        jcf.lib.removeClass(this.selectDrop, this.options.dropHiddenClass);
        jcf.lib.addClass(this.fakeElement,this.options.dropActiveClass);
        this.positionDropdown();

        // highlight current active item
        var activeItem = this.getFakeActiveOption();
        this.removeClassFromItems(this.options.currentSelectedClass);
        jcf.lib.addClass(activeItem, this.options.currentSelectedClass);

        // show current dropdown
        jcf.lib.event.add(window, 'resize', this.onResizeWindow, this);
        jcf.lib.event.add(window, 'scroll', this.onScrollWindow, this);
        jcf.lib.event.add(document, jcf.eventPress, this.onClickOutside, this);
        this.positionDropdown();
    },
    hideDropdown: function(partial){
        if(this.selectDrop.parentNode) {
            if(this.selectDrop.offsetWidth) {
                this.selectDrop.parentNode.removeChild(this.selectDrop);
            }
            if(partial) {
                return;
            }
        }
        if(typeof this.origSelectedIndex === 'number') {
            this.realElement.selectedIndex = this.origSelectedIndex;
        }
        jcf.lib.removeClass(this.fakeElement,this.options.dropActiveClass);
        jcf.lib.addClass(this.selectDrop, this.options.dropHiddenClass);
        jcf.lib.event.remove(window, 'resize', this.onResizeWindow);
        jcf.lib.event.remove(window, 'scroll', this.onScrollWindow);
        jcf.lib.event.remove(document.documentElement, jcf.eventPress, this.onClickOutside);
        if(jcf.isTouchDevice) {
            this.onBlur();
        }
    },
    toggleDropdown: function(){
        if(!this.realElement.disabled) {
            if(jcf.isTouchDevice) {
                this.onFocus();
            } else {
                this.realElement.focus();
            }
            this.dropOpened = true;
                if(this.isActiveDrop()) {
                    this.hideDropdown();
                } else {
                    this.showDropdown();
                }
            this.refreshState();
        }
    },
    scrollToItem: function(){
        if(this.isActiveDrop()) {
            var dropHeight = this.selectList.offsetHeight;
            var offsetTop = this.calcOptionOffset(this.getFakeActiveOption());
            var sTop = this.selectList.scrollTop;
            var oHeight = this.getFakeActiveOption().offsetHeight;
            //offsetTop+=sTop;

            if(offsetTop >= sTop + dropHeight) {
                this.selectList.scrollTop = offsetTop - dropHeight + oHeight;
            } else if(offsetTop < sTop) {
                this.selectList.scrollTop = offsetTop;
            }
        }
    },
    getFakeActiveOption: function(c) {
        return jcf.lib.queryBySelector('li[rel="'+(typeof c === 'number' ? c : this.realElement.selectedIndex) +'"]',this.selectList)[0];
    },
    calcOptionOffset: function(fake) {
        var h = 0;
        var els = jcf.lib.queryBySelector('.jcfcalc',this.selectList);
        for(var i = 0; i < els.length; i++) {
            if(els[i] == fake) break;
            h+=els[i].offsetHeight;
        }
        return h;
    },
    childrenHasItem: function(hold,item) {
        var items = hold.getElementsByTagName('*');
        for(i = 0; i < items.length; i++) {
            if(items[i] == item) return true;
        }
        return false;
    },
    removeClassFromItems: function(className){
        var children = jcf.lib.queryBySelector('li',this.selectList);
        for(var i = children.length - 1; i >= 0; i--) {
            jcf.lib.removeClass(children[i], className);
        }
    },
    setSelectedClass: function(c){
        jcf.lib.addClass(this.getFakeActiveOption(c), this.options.selectedClass);
    },
    refreshSelectedClass: function(c){
        if(!this.options.showNativeDrop) {
            this.removeClassFromItems(this.options.selectedClass);
            this.setSelectedClass(c);
        }
        if(this.realElement.disabled) {
            jcf.lib.addClass(this.fakeElement, this.options.disabledClass);
            if(this.labelFor) {
                jcf.lib.addClass(this.labelFor, this.options.labelDisabledClass);
            }
        } else {
            jcf.lib.removeClass(this.fakeElement, this.options.disabledClass);
            if(this.labelFor) {
                jcf.lib.removeClass(this.labelFor, this.options.labelDisabledClass);
            }
        }
    },
    refreshSelectedText: function() {
        if(!this.dropOpened && this.realElement.title) {
            this.valueText.innerHTML = this.realElement.title;
        } else {
            if(this.realElement.options[this.realElement.selectedIndex].title) {
                var optImage = this.parseOptionTitle(this.realElement.options[this.realElement.selectedIndex].title);
                this.valueText.innerHTML = (optImage ? '<img src="'+optImage+'" alt="" />' : '') + this.realElement.options[this.realElement.selectedIndex].innerHTML;
            } else {
                this.valueText.innerHTML = this.realElement.options[this.realElement.selectedIndex].innerHTML;
            }
        }
    },
    refreshState: function(){
        this.origSelectedIndex = this.realElement.selectedIndex;
        this.refreshSelectedClass();
        this.refreshSelectedText();
        if(!this.options.showNativeDrop) {
            this.positionDropdown();
            if(this.selectDrop.offsetWidth) {
                this.scrollToItem();
            }
        }
    }
});
/*! HTML5 Shiv vpre3.6 | @afarkas @jdalton @jon_neal @rem | MIT/GPL2 Licensed */
;(function(o,s){var g=o.html5||{};var j=/^<|^(?:button|map|select|textarea|object|iframe|option|optgroup)$/i;var d=/^<|^(?:a|b|button|code|div|fieldset|form|h1|h2|h3|h4|h5|h6|i|iframe|img|input|label|li|link|ol|option|p|param|q|script|select|span|strong|style|table|tbody|td|textarea|tfoot|th|thead|tr|ul)$/i;var x;var k="_html5shiv";var c=0;var u={};var h;(function(){var A=s.createElement("a");A.innerHTML="<xyz></xyz>";x=("hidden" in A);h=A.childNodes.length==1||(function(){try{(s.createElement)("a")}catch(B){return true}var C=s.createDocumentFragment();return(typeof C.cloneNode=="undefined"||typeof C.createDocumentFragment=="undefined"||typeof C.createElement=="undefined")}())}());function i(A,C){var D=A.createElement("p"),B=A.getElementsByTagName("head")[0]||A.documentElement;D.innerHTML="x<style>"+C+"</style>";return B.insertBefore(D.lastChild,B.firstChild)}function q(){var A=n.elements;return typeof A=="string"?A.split(" "):A}function w(A){var B=u[A[k]];if(!B){B={};c++;A[k]=c;u[c]=B}return B}function t(D,A,C){if(!A){A=s}if(h){return A.createElement(D)}C=C||w(A);var B;if(C.cache[D]){B=C.cache[D].cloneNode()}else{if(d.test(D)){B=(C.cache[D]=C.createElem(D)).cloneNode()}else{B=C.createElem(D)}}return B.canHaveChildren&&!j.test(D)?C.frag.appendChild(B):B}function y(C,E){if(!C){C=s}if(h){return C.createDocumentFragment()}E=E||w(C);var F=E.frag.cloneNode(),D=0,B=q(),A=B.length;for(;D<A;D++){F.createElement(B[D])}return F}function z(A,B){if(!B.cache){B.cache={};B.createElem=A.createElement;B.createFrag=A.createDocumentFragment;B.frag=B.createFrag()}A.createElement=function(C){if(!n.shivMethods){return B.createElem(C)}return t(C)};A.createDocumentFragment=Function("h,f","return function(){var n=f.cloneNode(),c=n.createElement;h.shivMethods&&("+q().join().replace(/\w+/g,function(C){B.createElem(C);B.frag.createElement(C);return'c("'+C+'")'})+");return n}")(n,B.frag)}function e(A){if(!A){A=s}var B=w(A);if(n.shivCSS&&!x&&!B.hasCSS){B.hasCSS=!!i(A,"article,aside,figcaption,figure,footer,header,hgroup,nav,section{display:block}mark{background:#FF0;color:#000}")}if(!h){z(A,B)}return A}var n={elements:g.elements||"abbr article aside audio bdi canvas data datalist details figcaption figure footer header hgroup mark meter nav output progress section summary time video",shivCSS:!(g.shivCSS===false),supportsUnknownElements:h,shivMethods:!(g.shivMethods===false),type:"default",shivDocument:e,createElement:t,createDocumentFragment:y};o.html5=n;e(s);var b=/^$|\b(?:all|print)\b/;var l="html5shiv";var r=!h&&(function(){var A=s.documentElement;return !(typeof s.namespaces=="undefined"||typeof s.parentWindow=="undefined"||typeof A.applyElement=="undefined"||typeof A.removeNode=="undefined"||typeof o.attachEvent=="undefined")}());function f(E){var F,C=E.getElementsByTagName("*"),D=C.length,B=RegExp("^(?:"+q().join("|")+")$","i"),A=[];while(D--){F=C[D];if(B.test(F.nodeName)){A.push(F.applyElement(v(F)))}}return A}function v(C){var D,A=C.attributes,B=A.length,E=C.ownerDocument.createElement(l+":"+C.nodeName);while(B--){D=A[B];D.specified&&E.setAttribute(D.nodeName,D.nodeValue)}E.style.cssText=C.style.cssText;return E}function a(D){var F,E=D.split("{"),B=E.length,A=RegExp("(^|[\\s,>+~])("+q().join("|")+")(?=[[\\s,>+~#.:]|$)","gi"),C="$1"+l+"\\:$2";while(B--){F=E[B]=E[B].split("}");F[F.length-1]=F[F.length-1].replace(A,C);E[B]=F.join("}")}return E.join("{")}function p(B){var A=B.length;while(A--){B[A].removeNode()}}function m(A){var E,C,B=A.namespaces,D=A.parentWindow;if(!r||A.printShived){return A}if(typeof B[l]=="undefined"){B.add(l)}D.attachEvent("onbeforeprint",function(){var F,J,H,L=A.styleSheets,I=[],G=L.length,K=Array(G);while(G--){K[G]=L[G]}while((H=K.pop())){if(!H.disabled&&b.test(H.media)){try{F=H.imports;J=F.length}catch(M){J=0}for(G=0;G<J;G++){K.push(F[G])}try{I.push(H.cssText)}catch(M){}}}I=a(I.reverse().join(""));C=f(A);E=i(A,I)});D.attachEvent("onafterprint",function(){p(C);E.removeNode(true)});A.printShived=true;return A}n.type+=" print";n.shivPrint=m;m(s)}(this,document));

(function($) {
    $(function(){
        $(document).ready(function(){
            // Toggle Box
            jQuery("ul.toggle-holder").each(function(){
                jQuery(this).children("li").bind("click", function(){
                    jQuery(this).children().addClass(function(){
                        if(jQuery(this).hasClass("active")){
                            jQuery(this).removeClass("active");
                            return "";
                        }
                        return "active";
                    });
                    jQuery(this).siblings(".slide").slideToggle('slow', function() {});
                    return false;
                    event.preventDefault();
                    event.stopPropagation();
                });
            });
            // Toggle Box
            jQuery("ul.toggle-holder li").each(function(){
                jQuery(this).children(".slide").not(".active").css('display','none');

                jQuery(this).children("a").bind("click", function(){
                    jQuery(this).children().addClass(function(){
                        if(jQuery(this).hasClass("active")){
                            jQuery(this).removeClass("active");
                            return "";
                        }
                        return "active";
                    });
                    jQuery(this).siblings(".slide").slideToggle();
                    //return false;
                    event.preventDefault();
                    event.stopPropagation();
                });
            });

            // Accordion Box
            $('ul#accord li').click(function () {
                var text = $(this).children('div.slide');
                $(this).each(function() {
                    $('ul#accord li').removeClass('active');
                    $('ul#accord li div.slide').slideUp('400');
                });
                text.slideDown('400');
                $(this).addClass('active');
                return false;
                event.preventDefault();
                event.stopPropagation();
            });
        });
    });
 })(jQuery);

/* Twiitter function*/
function relative_time(time_value) {
  var values = time_value.split(" ");
  time_value = values[1] + " " + values[2] + ", " + values[5] + " " + values[3];
  var parsed_date = Date.parse(time_value);
  var relative_to = (arguments.length > 1) ? arguments[1] : new Date();
  var delta = parseInt((relative_to.getTime() - parsed_date) / 1000);
  delta = delta + (relative_to.getTimezoneOffset() * 60);

  if (delta < 60) {
    return 'less than a minute ago';
  } else if(delta < 120) {
    return 'about a minute ago';
  } else if(delta < (60*60)) {
    return (parseInt(delta / 60)).toString() + ' minutes ago';
  } else if(delta < (120*60)) {
    return 'about an hour ago';
  } else if(delta < (24*60*60)) {
    return 'about ' + (parseInt(delta / 3600)).toString() + ' hours ago';
  } else if(delta < (48*60*60)) {
    return '1 day ago';
  } else {
    return (parseInt(delta / 86400)).toString() + ' days ago';
  }
}





/* Message boxes close button*/
!function ($) {

  "use strict"; // jshint ;_;


 /* ALERT CLASS DEFINITION
  * ====================== */

  var dismiss = '[data-dismiss="alert"]'
    , Alert = function (el) {
        $(el).on('click', dismiss, this.close)
      }

  Alert.prototype.close = function (e) {
    var $this = $(this)
      , selector = $this.attr('data-target')
      , $parent

    if (!selector) {
      selector = $this.attr('href')
      selector = selector && selector.replace(/.*(?=#[^\s]*$)/, '') //strip for ie7
    }

    $parent = $(selector)

    e && e.preventDefault()

    $parent.length || ($parent = $this.hasClass('alert') ? $this : $this.parent())

    $parent.trigger(e = $.Event('close'))

    if (e.isDefaultPrevented()) return

    $parent.removeClass('in')

    function removeElement() {
      $parent
        .trigger('closed')
        .remove()
    }

    $.support.transition && $parent.hasClass('fade') ?
      $parent.on($.support.transition.end, removeElement) :
      removeElement()
  }


 /* ALERT PLUGIN DEFINITION
  * ======================= */

  $.fn.alert = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('alert')
      if (!data) $this.data('alert', (data = new Alert(this)))
      if (typeof option == 'string') data[option].call($this)
    })
  }

  $.fn.alert.Constructor = Alert


 /* ALERT DATA-API
  * ============== */

  $(function () {
    $('body').on('click.alert.data-api', dismiss, Alert.prototype.close)
  })

}(window.jQuery);
