var Mathi = Mathi || {};

(function () {
    'use strict';

    var fps = 30;
    var interval = 1000 / fps;

    var rnd = function(min, max){
        var r= Math.floor((Math.random() * max) + min);
        return r;
    };

    Mathi.animating = false;

    Mathi.draw = function() {

        setTimeout(function() {
            window.requestAnimationFrame(Mathi.draw);

            Mathi.challenge.set({
                time: Mathi.challenge.get('time') + 1
            });

        }, interval);
    },

    Mathi.generateChallenge = function() {
        var ops = ['+', '-', 'X', '/'],
            op = rnd(0, ops.length),
            t1='', t2='', sol;

        switch(ops[op]) {
            case '+':
                t1 = rnd(1, 99);
                t2 = rnd(1, 99);
                sol = t1 + t2;
            break;
            case '-':
                t1 = rnd(1, 99);
                t2 = rnd(1, 99);
                t1 = t1 + t2;
                t2 = t1 - t2;
                sol= t1 - t2;
            break;
            case 'X':
                t1 = rnd(1, 99);
                t2 = rnd(1, 10);
                sol = t1 * t2;
            break;
            case '/':
                sol = rnd(1, 10) 
                t2 = rnd(1, 99) 
                t1 = t2 * sol; 
            break;
        } 

        return {
            expression : t1 + ops[op] + t2,
            solution : sol        
        };
    };

     Mathi.init = function(element) {

        this.challenge = new Mathi.Challenge( Mathi.generateChallenge() );
        
        var cView = new Mathi.ChallengeView({
            userResponse: new Mathi.UserResponse(),
            el: element,
            model: this.challenge
        });

        //Mathi.draw();
    };

    Mathi.UserResponse = Backbone.Model.extend({
        defaults: {
            response: '',
            fired: false
        }
    });

    Mathi.UserPanelView = Backbone.View.extend( {
        id: 'user-panel',
        userInput: null,
        template: _.template( $('#user-panel-tpl').html() ),

        initialize: function() {  
            this.listenTo(this.model, "change:response", this.handleUserResponse);            
            this.listenTo(this.model, "change:fired", this.firedResponse);            
        },

        render: function() {
            this.$el.html(
                this.template( this.model.toJSON() )
            );

            return this;
        },

        firedResponse : function(model, fired) {
            if (fired) {
                this.userInput.val("");
                model.set( {
                    response: '',
                    fired: false
                });
            }
        },

        initEvents : function() {
            var form = $('#mathi-solution-form'), 
            obj = this;

            // Cache user input field
            this.userInput = $('#mathi-solution');

            // fast buttons
            form.find('button.number').fasttap({
                callback: function (event) {
                    obj.model.set({
                        response : obj.model.get('response') + $(this).html()
                    });

                    $(this).blur();
                }
            });     
            /*
            // Numbers buttons
            form.find('.number').each(function(i, elem) {
                $(elem).on('click', function(e) {
                    e.preventDefault();

                    obj.model.set({
                        response : obj.model.get('response') + $(this).html()
                    });

                    $(this).blur();                    
                });
            });  */

            // Equal's button
            form.find('.equal').on('click', function(evt) {
                form.submit();
                evt.preventDefault();
            });

            // User sends response
            form.submit(function(evt) {                
                evt.preventDefault();
                if (obj.model.get('response').trim()) {                    
                    obj.model.set('fired', true);
                }
            });              
        },

        handleUserResponse: function(model, userResponse) {
            this.userInput.val( userResponse );
        }

    });

    Mathi.Challenge = Backbone.Model.extend({
        defaults : {
            expression: '',
            solution: 0,
            time: 0,
            points: 0,
            wrong: 0,
            ok: 0,
            gameOver: false
        }
    });

    Mathi.ChallengeView = Backbone.View.extend({

        userResponse : null, // model
        template: _.template( $('#challenge-tpl').html() ),
        $ball: null,

        initialize: function(options) {
            this.userResponse = options.userResponse;                    

            this.listenTo(this.model, "change:expression", this.drawChallenge);
            this.listenTo(this.model, "change:wrong", this.showWrong);
            this.listenTo(this.model, "change:ok", this.showOk);
            this.listenTo(this.model, "change:time", this.addTime);
            this.listenTo(this.model, "change:points", this.addPoints);
            this.listenTo(this.userResponse, "change:fired", this.compareUserSolution);
            this.render( this.userResponse );
            this.initEvents();
            this.$ball = this.$el.find('#mathi-ball');
        },

        compareUserSolution : function(userResponse, fired) {
            if (fired) {

               var response = userResponse.get('response'), 
                    obj = this, 
                    currentColor = obj.$ball.css('backgroundColor');

                if (response != this.model.get('solution')) {
                    obj.model.set({
                        wrong : obj.model.get('wrong') + 1,
                        points: obj.model.get('points') - 5
                    });

                    obj.$ball.addClass('notransition').css({backgroundColor: 'red'});

                    setTimeout(function() {
                        obj.$ball.css('backgroundColor', currentColor);
                    },100);
                    
                    setTimeout(function() {
                        obj.$ball.removeClass('notransition').css({backgroundColor: 'red'});
                    },300);

                } else { // ok
                    obj.model.set({
                        ok    : obj.model.get('ok') + 1,
                        time  : 0,
                        points: obj.model.get('points') + 10 
                    });

                    obj.$ball.addClass('notransition').css({backgroundColor: 'green'});

                    setTimeout(function() {
                        obj.$ball.removeClass('notransition').css({backgroundColor: 'red'});
                    },40);

                    obj.model.set( Mathi.generateChallenge() );
                }
            }
            
        },

        initEvents : function() {
            
            var obj = this;

            setTimeout(function() {
                obj.$ball.addClass('init-ball');
                obj.$ball.on("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd", function(){
                    obj.model.set('gameOver', true);
                });
            },100);            
        },

        addPoints: function(model, points) {
            $('#mathi-points').html(
                model.get('points')
            );
        },

        addTime : function(model, time) {
            var scale = 1 + (time / 1000);
            this.$ball.css({transform: 'scale('+ scale +')'});
        },

        showOk : function(model, ok) {
            var scale = 1 - (ok / 100);

            this.$ball.css({
                transform: 'scale('+ scale +')',
                backgroundColor:'green'
            });
        },

        showWrong : function(model, wrong) {
            var scale = 1 + (wrong / 100);

            this.$ball.css({
                transform: 'scale('+ scale +')',
                backgroundColor:'red'
            });
        },

        drawChallenge : function(challenge, exp) {    
            this.$el.find('.mathi-expression').html(exp);              
        },

        render: function(userResponse) {      

            this.$el.html(
                this.template( this.model.toJSON() )
            );

            var userPanelView = new Mathi.UserPanelView({
                model: userResponse
            });

            this.$el.append(
                userPanelView.render().el
            );

            userPanelView.initEvents();

            return this;
        }
    });


})();
