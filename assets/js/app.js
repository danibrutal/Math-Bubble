var app = app || {};

(function () {
    'use strict';

    app.animating = false;

    app.Item = Backbone.Model.extend({
        defaults : {
            id: '',
            filename: '',
            selected: false,
            index: 0,
            styles: {}
        } 
    });

    app.ItemView = Backbone.View.extend({

        className: 'item-view',
        tagName : 'li',
        template: _.template( $('#item-tpl').html() ),

        initialize: function() {
            this.listenTo(this.model, "change:selected", this.animateSelected);
            this.listenTo(this.model, "change:styles", this.restyle);
        },

        restyle : function(item, styles) {    
            this.$el.css(styles);                  
        },

        animateSelected : function(item, selected) {            
            this.$el.find('.item').toggleClass('selected');  
            this.$el.toggleClass('selected-item');
        },

        render: function() {      

            this.$el.html(
                this.template( this.model.toJSON() )
            );

            this.$el.on('transitionend webkitTransitionEnd', function(){
                setTimeout(function() {
                    app.animating = false;
                },100);
            });  

            return this;
        }
    });

    app.Carrousel = Backbone.Collection.extend({
        model: app.Item
    });

    app.CarrouselView = Backbone.View.extend({

        defaultOptions: {
            onSelected: null,
            itemsToShow: 5
        },

        percentWidth: 0.94,
        direction   : '',
        template    : _.template( $('#carrousel-tpl').html() ),

        initialize: function ( items, el, options) {
            this.$el        = $(el);
            this.collection = new app.Carrousel (items);
            this.options    = $.extend({}, this.defaultOptions, options); 

            this.render();           
            this.initControlsEvent();
            this.listenTo(this.collection, 'change:index', this.relocateItem);          
            this.listenTo(this.collection, 'change:selected', this.slide);   
            
            var timer, obj = this;
            $(window).on('resize',function(){
                timer && clearTimeout(timer);
                timer = setTimeout(obj.relocateItems.apply(obj), 100);
            });       
        },

        relocateItems : function() {
            this.collection.each(function( item, i ){
                this.relocateItem(item, item.get('index'));
            }, this);
        },

        relocateItem : function(item, index) {
            var elWidth = this.$el.width(),
                left = (elWidth * this.percentWidth) / this.options.itemsToShow,
                visible = index > 0 && index <= this.options.itemsToShow;

            item.set({
                styles:{
                    visibility: visible ? 'visible' : 'hidden',
                    left: left * (index - 1)
                }
            });
        },

        slide: function(model) {

            if (model.get('selected') == true) {
                var direction = this.direction,
                    numItems = this.collection.length,
                    newIndex;

                this.collection.each(function(item, i) {

                    newIndex = direction == 'left' 
                    ? item.get('index') + 1 
                    : item.get('index') - 1;

                    if(newIndex < 0) newIndex = numItems -1;

                    item.set({index: newIndex % numItems});                    
                });
            }
        },

        initControlsEvent: function() {
            var collection  = this.collection;
            var obj = this;

            var changeSelected = function(i) {

                var selected = collection.findWhere({
                    selected : true
                });

                var indexSelected = selected.get('index');  
                var newCurrent    = collection.findWhere({index: indexSelected + i});

                newCurrent.set({
                    selected : true
                });

                selected.set({
                    selected : false
                }); 
                
            };

            this.$el.find('.left').click(function(evt) {
                if (! app.animating) {
                    app.animating = true;
                    obj.direction = 'left';           
                    changeSelected(-1);     
                    $(this).blur();
                } 
                
                evt.preventDefault();                                          
            });

            this.$el.find('.right').click(function(evt) { 
                if (! app.animating) {
                    app.animating = true;
                    obj.direction = 'right';
                    changeSelected(1);
                    $(this).blur();
                }                           

                evt.preventDefault();
            });

        },

        render: function() {

            var elWidth     = this.$el.width(),
                iSelected   = Math.floor(this.options.itemsToShow / 2) + 1,
                leftDefault = (elWidth * this.percentWidth) / this.options.itemsToShow,
                visible;

            this.$el.html( this.template() );

            this.collection.each(function( item, i ){

                this.renderItem( item );  

                visible = i > 0 && i <= this.options.itemsToShow;

                if (i == iSelected) {
                    item.set('selected', true); 
                }     
                
                item.set({
                    index: i,
                    styles:{
                        left: leftDefault * (i - 1),
                        visibility : visible ? 'visible' : 'hidden'
                    },
                }); 

            }, this);
        },

        renderItem: function ( item ) {

            var ulList = this.$el.find('ul');
            
            var itemView = new app.ItemView({
                model: item
            });       

            ulList.append( itemView.render().el );
        } 
    });

})();
