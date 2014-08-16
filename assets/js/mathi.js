var Mathi = Mathi || {};

(function () {
    'use strict';

    var fps = 60;
    var interval = 1000 / fps;

    var rnd = function(min, max){
        return Math.floor((Math.random() * max) + min);
    };

    Mathi.gameOver = false;

    Mathi.draw = function() {

        setTimeout(function() {

            if (! Mathi.gameOver) {                
                Mathi.challenge.set({
                    time: Mathi.challenge.get('time') + 1
                });

                window.requestAnimationFrame(Mathi.draw);
            }
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
            userScore: new Mathi.Score(),
            el: element,
            model: this.challenge
        });

        Mathi.draw();
    };

    Mathi.Score = Backbone.Model.extend({
        defaults: {
            points: 0
        }
    });

    Mathi.ScoreView = Backbone.View.extend( {
        className: 'wrapper-points',
        template: _.template( $('#user-score-tpl').html() ),

        initialize: function() {  
            this.listenTo(this.model, "change:points", this.addPoints);       
        },

        addPoints: function(model, points) {
            $('#mathi-points').html(
                model.get('points')
            );
        },

        render: function() {
            this.$el.html(
                this.template( this.model.toJSON() )
            );

            return this;
        }
    });

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
            form.find('.number').on('tap', function (event) {
                obj.model.set({
                    response : obj.model.get('response') + $(this).html()
                });

                $(this).blur();
                event.preventDefault();
            });     
           
            // Equal's button
            form.find('.equal').on('tap', function (event) {
                form.submit();

                $(this).blur();
                event.preventDefault();                
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
            console.log(userResponse);
            this.userInput.val( userResponse );
        }

    });

    Mathi.Challenge = Backbone.Model.extend({
        defaults : {
            expression: '',
            solution: 0,
            time: 0,
            wrong: 0,
            ok: 0,
            gameOver: false
        }
    });

    Mathi.ChallengeView = Backbone.View.extend({

        userResponse : null, // model
        userScore: null, // model
        template: _.template( $('#challenge-tpl').html() ),
        $ball: null,

        initialize: function(options) {
            this.userResponse = options.userResponse;                    
            this.userScore = options.userScore;                    

            this.listenTo(this.model, "change:expression", this.drawChallenge);
            this.listenTo(this.model, "change:wrong", this.showWrong);
            this.listenTo(this.model, "change:ok", this.showOk);
            this.listenTo(this.model, "change:time", this.addTime);
            this.listenTo(this.model, "change:gameOver", this.showGameOver);
            this.listenTo(this.userResponse, "change:fired", this.compareUserSolution);
            this.render( this.userResponse, this.userScore);
            this.initEvents();
            this.$ball = this.$el.find('#mathi-ball');
        },

        showGameOver : function(model, gameOver) {
            if (gameOver) {
                Mathi.gameOver = true;

                this.$el.find('.mathi-expression').html(
                    '<span class="game-over">Game over !</span>'
                );   
                this.stopListening(); 
            }
        },

        compareUserSolution : function(userResponse, fired) {
            if (fired) {

               var response = userResponse.get('response'), 
                    obj = this, 
                    currentColor = obj.$ball.css('backgroundColor');

                if (response != this.model.get('solution')) {
                    
                    obj.model.set({
                        wrong : obj.model.get('wrong') + 1                        
                    });

                    obj.userScore.set('points', obj.userScore.get('points') - 5);
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
                        time  : 0
                    });

                    obj.userScore.set('points', obj.userScore.get('points') + 10);
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

        render: function(userResponse, userScore) {      

            this.$el.html(
                this.template( this.model.toJSON() )
            );

            var userPanelView = new Mathi.UserPanelView({
                model: userResponse
            }), userScoreView = new Mathi.ScoreView({
                model: userScore
            });

            this.$el.append( userPanelView.render().el );
            this.$el.append( userScoreView.render().el );

            userPanelView.initEvents();

            return this;
        }
    });


})();
