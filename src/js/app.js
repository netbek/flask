// Motion along path http://bl.ocks.org/mbostock/1705868
// Liquid Fill Gauge https://gist.github.com/brattonc/5e5ce9beee483220e2f6
// @todo Use RAF polyfill https://github.com/chrisdickinson/raf

(function () {
  var src = '../svg/sprite.svg';
  var mimeType = 'image/svg+xml';

  var bubbleXML;
  var burstXML;
  var svg;
  var width = 512;
  var height = 512;
  var debug = false;

  function Flask() {}

  Flask.prototype = {
    constructor: Flask,
    /**
     *
     * @return {Flask}
     */
    init: function () {
      var flask = svg.append('g');
      flask.append('use')
        .attr('xlink:href', '#flask');

      return this;
    }
  };

  function Bubble() {}

  Bubble.prototype = {
    constructor: Bubble,
    /**
     *
     * @return {Bubble}
     */
    init: function () {
      var bubble = svg.append('svg')
        .attr('viewBox', '0 0 64 64')
        .attr('width', 64)
        .attr('height', 64);
      bubble.append('use')
        .attr('xlink:href', '#bubble');
      bubble.attr('visibility', 'hidden');

      var burst = svg.append('svg')
        .attr('viewBox', '0 0 64 64')
        .attr('width', 64)
        .attr('height', 64);
      burst.append('use')
        .attr('xlink:href', '#burst');
      burst.attr('visibility', 'hidden');

      var x = getRandomInt(width / 2 - 50, width / 2 + 50);

      var motionPathPoints = [
        [x, height - 60],
        [x, 60]
      ];
      var motionPath = svg.append('path')
        .data([motionPathPoints])
        .attr('d', d3.line())
        .attr('stroke', 'red');

      if (!debug) {
        motionPath.attr('visibility', 'hidden');
      }

      this.bubble = bubble;
      this.burst = burst;
      this.motionPath = motionPath;

      return Promise.resolve();
    },
    /**
     *
     * @return {Promise}
     */
    destroy: function () {
      this.bubble.remove();
      this.burst.remove();
      this.motionPath.remove();

      return Promise.resolve();
    },
    /**
     *
     * @return {Promise}
     */
    run: function () {
      var bubble = this.bubble;
      var burst = this.burst;
      var motionPath = this.motionPath;

      var motionPathNode = motionPath.node();
      var totalPoints = motionPathNode.getTotalLength();

      return new Promise(function (resolve, reject) {
        $.Velocity.RunSequence([{
          e: jQuery(bubble.node()),
          p: {
            tween: [1, 0]
          },
          o: {
            easing: 'easeInOutQuad',
            duration: 2000,
            begin: function () {
              // Move bubble to start position
              var point = motionPathNode.getPointAtLength(0);
              move(bubble, point.x, point.y, 64, 64);
              // Show bubble
              bubble.attr('visibility', null);
            },
            progress: function (elements, complete, remaining, start, tweenValue) {
              // Move bubble along path
              var point = motionPathNode.getPointAtLength(tweenValue * totalPoints);
              move(bubble, point.x, point.y, 64, 64);
            }
          }
        }, {
          e: jQuery(burst.node()),
          p: {
            opacity: 0
          },
          o: {
            delay: 500,
            duration: 1000,
            begin: function () {
              // Move burst to bubble's last position
              var point = motionPathNode.getPointAtLength(totalPoints);
              move(burst, point.x, point.y, 64, 64);
              // Show burst
              burst.attr('visibility', null);
              // Hide bubble
              bubble.attr('visibility', 'hidden');
            },
            complete: resolve
          }
        }]);
      });
    }
  };

  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function move(path, x, y, width, height) {
    path.attr('x', x - width / 2)
      .attr('y', y - height / 2);
  }

  function translate(path, x, y) {
    path.attr('transform', 'translate(' + x + ',' + y + ')');
  }

  d3.xml(src)
    .mimeType(mimeType)
    .get(function (error, xml) {
      if (error) {
        throw error;
      }

      var sprite = xml.getElementsByTagName('svg')[0];
      sprite.setAttribute('hidden', 'hidden');
      document.body.appendChild(sprite);

      svg = d3.select('body')
        .append('svg')
        .attr('class', 'stage')
        .attr('viewBox', '0 0 512 512');

      // var bubbles = [];
      // var max = 10;
      //
      // function add() {
      //   var bb = new Bubble;
      //
      //   bubbles.push(bb);
      //
      //   bb.init()
      //     .then(function () {
      //       return bb.run();
      //     })
      //     .then(function () {
      //       bb.destroy();
      //       remove(bb);
      //     });
      // }
      //
      // function remove(bubble) {
      //   bubbles = _.difference(bubbles, [bubble]);
      // }
      //
      // function run() {
      //   console.log(bubbles.length);
      //
      //   if (bubbles.length < max) {
      //     add();
      //   }
      // }
      //
      // var handle = requestInterval(run, 500);

      svg.attr('id', 'fillgauge')
        .attr('viewBox', '0 0 320 384')
        .attr('width', 320)
        .attr('height', 384);

      var config = liquidFillGaugeDefaultSettings();
      config.circleThickness = 0;
      config.circleFillGap = 0;
      config.waveAnimateTime = 2000;
      config.waveCount = 1;

      var g = loadLiquidFillGauge('fillgauge', 50, config);

      setTimeout(function () {
        g.update(80);
      }, 2000);

      // var liquid = svg.append('svg')
      //   .attr('viewBox', '0 0 320 384')
      //   .attr('width', 320)
      //   .attr('height', 384);
      // liquid.append('use')
      //   .attr('xlink:href', '#liquid');

      function liquidFillGaugeDefaultSettings() {
        return {
          minValue: 0, // The gauge minimum value.
          maxValue: 100, // The gauge maximum value.
          circleThickness: 0.05, // The outer circle thickness as a percentage of it's radius.
          circleFillGap: 0.05, // The size of the gap between the outer circle and wave circle as a percentage of the outer circles radius.
          circleColor: '#178BCA', // The color of the outer circle.
          waveHeight: 0.1, // The wave height as a percentage of the radius of the wave circle.
          waveCount: 2, // The number of full waves per width of the wave circle.
          waveRiseTime: 2000, // The amount of time in milliseconds for the wave to rise from 0 to it's final height.
          waveAnimateTime: 1500, // The amount of time in milliseconds for a full wave to enter the wave circle.
          waveRise: true, // Control if the wave should rise from 0 to it's full height, or start at it's full height.
          waveHeightScaling: true, // Controls wave size scaling at low and high fill percentages. When true, wave height reaches it's maximum at 50% fill, and minimum at 0% and 100% fill. This helps to prevent the wave from making the wave circle from appear totally full or empty when near it's minimum or maximum fill.
          waveAnimate: true, //2 Controls if the wave scrolls or is static.
          waveColor: '#178BCA', // The color of the fill wave.
          waveOffset: .25, // The amount to initially offset the wave. 0 = no offset. 1 = offset of one full wave.
          textVertPosition: .5, // The height at which to display the percentage text withing the wave circle. 0 = bottom, 1 = top.
          textSize: 1, // The relative height of the text to display in the wave circle. 1 = 50%
          valueCountUp: true, // If true, the displayed value counts up from 0 to it's final value upon loading. If false, the final value is displayed.
          displayPercent: true, // If true, a % symbol is displayed after the value.
          textColor: '#045681', // The color of the value text when the wave does not overlap it.
          waveTextColor: '#A4DBf8' // The color of the value text when the wave overlaps it.
        };
      }

      function loadLiquidFillGauge(elementId, value, config) {
        if (!config) {
          config = liquidFillGaugeDefaultSettings();
        };

        var gauge = d3.select('#' + elementId);
        var gaugeWidth = parseInt(gauge.style('width'));
        var gaugeHeight = parseInt(gauge.style('height'));
        // var radius = Math.min(gaugeWidth, gaugeHeight) / 2;
        var radius = Math.max(gaugeWidth, gaugeHeight) / 2;

        // var locationX = gaugeWidth / 2 - radius;
        // var locationY = gaugeHeight / 2 - radius;
        var fillPercent = Math.max(config.minValue, Math.min(config.maxValue, value)) / config.maxValue;

        var waveHeightScale;
        if (config.waveHeightScaling) {
          waveHeightScale = d3.scaleLinear()
            .range([0, config.waveHeight, 0])
            .domain([0, 50, 100]);
        }
        else {
          waveHeightScale = d3.scaleLinear()
            .range([config.waveHeight, config.waveHeight])
            .domain([0, 100]);
        }

        // var textPixels = (config.textSize * radius / 2);
        // var textFinalValue = parseFloat(value).toFixed(2);
        // var textStartValue = config.valueCountUp ? config.minValue : textFinalValue;
        // var percentText = config.displayPercent ? '%' : '';
        var circleThickness = config.circleThickness * radius;
        var circleFillGap = config.circleFillGap * radius;
        var fillCircleMargin = circleThickness + circleFillGap;
        var fillCircleRadius = radius - fillCircleMargin;
        var waveHeight = fillCircleRadius * waveHeightScale(fillPercent * 100);

        var waveLength = fillCircleRadius * 2 / config.waveCount;
        var waveClipCount = 1 + config.waveCount;
        var waveClipWidth = waveLength * waveClipCount;

        // // Rounding functions so that the correct number of decimal places is always displayed as the value counts up.
        // let textRounder = function (value) {
        //   return Math.round(value);
        // };
        // if (parseFloat(textFinalValue) != parseFloat(textRounder(textFinalValue))) {
        //   textRounder = function (value) {
        //     return parseFloat(value).toFixed(1);
        //   };
        // }
        // if (parseFloat(textFinalValue) != parseFloat(textRounder(textFinalValue))) {
        //   textRounder = function (value) {
        //     return parseFloat(value).toFixed(2);
        //   };
        // }

        // Data for building the clip wave area.
        var data = [];
        for (var i = 0; i <= 40 * waveClipCount; i++) {
          data.push({
            x: i / (40 * waveClipCount),
            y: (i / (40))
          });
        }

        // Scales for drawing the outer circle.
        var gaugeCircleX = d3.scaleLinear().range([0, 2 * Math.PI]).domain([0, 1]);
        var gaugeCircleY = d3.scaleLinear().range([0, radius]).domain([0, radius]);

        // Scales for controlling the size of the clipping path.
        var waveScaleX = d3.scaleLinear().range([0, waveClipWidth]).domain([0, 1]);
        var waveScaleY = d3.scaleLinear().range([0, waveHeight]).domain([0, 1]);

        // Scales for controlling the position of the clipping path.
        var waveRiseScale = d3.scaleLinear()
          // The clipping area size is the height of the fill circle + the wave height, so we position the clip wave
          // such that the it will overlap the fill circle at all when at 0%, and will totally cover the fill
          // circle at 100%.
          .range([(fillCircleMargin + fillCircleRadius * 2 + waveHeight), (fillCircleMargin - waveHeight)])
          .domain([0, 1]);
        var waveAnimateScale = d3.scaleLinear()
          .range([0, waveClipWidth - fillCircleRadius * 2]) // Push the clip area one full wave then snap back.
          .domain([0, 1]);

        // // Scale for controlling the position of the text within the gauge.
        // var textRiseScaleY = d3.scaleLinear()
        //   .range([fillCircleMargin + fillCircleRadius * 2, (fillCircleMargin + textPixels * 0.7)])
        //   .domain([0, 1]);

        // Center the gauge within the parent SVG.
        // var gaugeGroup = gauge.append('g')
        //   .attr('transform', 'translate(' + locationX + ',' + locationY + ')');
        var gaugeGroup = gauge.append('g');

        // Draw the outer circle.
        // var gaugeCircleArc = d3.arc()
        //   .startAngle(gaugeCircleX(0))
        //   .endAngle(gaugeCircleX(1))
        //   .outerRadius(gaugeCircleY(radius))
        //   .innerRadius(gaugeCircleY(radius - circleThickness));
        // gaugeGroup.append('path')
        //   .attr('d', gaugeCircleArc)
        //   .style('fill', config.circleColor)
        //   .attr('transform', 'translate(' + radius + ',' + radius + ')');

        // // Text where the wave does not overlap.
        // var text1 = gaugeGroup.append('text')
        //   .text(textRounder(textStartValue) + percentText)
        //   .attr('class', 'liquidFillGaugeText')
        //   .attr('text-anchor', 'middle')
        //   .attr('font-size', textPixels + 'px')
        //   .style('fill', config.textColor)
        //   .attr('transform', 'translate(' + radius + ',' + textRiseScaleY(config.textVertPosition) + ')');
        // let text1InterpolatorValue = textStartValue;

        // The clipping wave area.
        var clipArea = d3.area()
          .x(function (d) {
            return waveScaleX(d.x);
          })
          .y0(function (d) {
            return waveScaleY(Math.sin(Math.PI * 2 * config.waveOffset * -1 + Math.PI * 2 * (1 - config.waveCount) + d.y * 2 * Math.PI));
          })
          .y1(function (d) {
            return (fillCircleRadius * 2 + waveHeight);
          });
        var waveGroup = gaugeGroup.append('defs')
          .append('clipPath')
          .attr('id', 'clipWave' + elementId);
        var wave = waveGroup.append('path')
          .datum(data)
          .attr('d', clipArea)
          .attr('T', 0);

        // The inner circle with the clipping wave attached.
        var fillCircleGroup = gaugeGroup.append('g')
          .attr('clip-path', 'url(' + location.href + '#clipWave' + elementId + ')');
        // fillCircleGroup.append('circle')
        //   .attr('cx', radius)
        //   .attr('cy', radius)
        //   .attr('r', fillCircleRadius)
        //   .style('fill', config.waveColor);

        fillCircleGroup.append('svg')
          .attr('viewBox', '0 0 ' + gaugeWidth + ' ' + gaugeHeight)
          .attr('width', gaugeWidth)
          .attr('height', gaugeHeight)
          .append('use')
          .attr('xlink:href', '#liquid');

        // // Text where the wave does overlap.
        // var text2 = fillCircleGroup.append('text')
        //   .text(textRounder(textStartValue))
        //   .attr('class', 'liquidFillGaugeText')
        //   .attr('text-anchor', 'middle')
        //   .attr('font-size', textPixels + 'px')
        //   .style('fill', config.waveTextColor)
        //   .attr('transform', 'translate(' + radius + ',' + textRiseScaleY(config.textVertPosition) + ')');
        // let text2InterpolatorValue = textStartValue;
        //
        // // Make the value count up.
        // if (config.valueCountUp) {
        //   text1.transition()
        //     .duration(config.waveRiseTime)
        //     .tween('text', function () {
        //       var i = d3.interpolateNumber(text1InterpolatorValue, textFinalValue);
        //       return (t) => {
        //         text1InterpolatorValue = textRounder(i(t));
        //         // Set the gauge's text with the new value and append the % sign
        //         // to the end
        //         text1.text(text1InterpolatorValue + percentText);
        //       }
        //     });
        //   text2.transition()
        //     .duration(config.waveRiseTime)
        //     .tween('text', function () {
        //       var i = d3.interpolateNumber(text2InterpolatorValue, textFinalValue);
        //       return (t) => {
        //         text2InterpolatorValue = textRounder(i(t));
        //         // Set the gauge's text with the new value and append the % sign
        //         // to the end
        //         text2.text(text2InterpolatorValue + percentText);
        //       }
        //     });
        // }

        // Make the wave rise. wave and waveGroup are separate so that horizontal and vertical movement can be controlled independently.
        var waveGroupXPosition = fillCircleMargin + fillCircleRadius * 2 - waveClipWidth;
        if (config.waveRise) {
          waveGroup.attr('transform', 'translate(' + waveGroupXPosition + ',' + waveRiseScale(0) + ')')
            .transition()
            .duration(config.waveRiseTime)
            .attr('transform', 'translate(' + waveGroupXPosition + ',' + waveRiseScale(fillPercent) + ')')
            .on('start', function () {
              wave.attr('transform', 'translate(1,0)');
            }); // This transform is necessary to get the clip wave positioned correctly when waveRise=true and waveAnimate=false. The wave will not position correctly without this, but it's not clear why this is actually necessary.
        }
        else {
          waveGroup.attr('transform', 'translate(' + waveGroupXPosition + ',' + waveRiseScale(fillPercent) + ')');
        }

        if (config.waveAnimate) {
          animateWave();
        }

        function animateWave() {
          wave.attr('transform', 'translate(' + waveAnimateScale(wave.attr('T')) + ',0)');
          wave.transition()
            .duration(config.waveAnimateTime * (1 - wave.attr('T')))
            .ease(d3.easeLinear)
            .attr('transform', 'translate(' + waveAnimateScale(1) + ',0)')
            .attr('T', 1)
            .on('end', function () {
              wave.attr('T', 0);
              animateWave(config.waveAnimateTime);
            });
        }

        function GaugeUpdater() {
          this.update = function (value) {
            // var newFinalValue = parseFloat(value).toFixed(2);
            // var textRounderUpdater = function (value) {
            //   return Math.round(value);
            // };
            // if (parseFloat(newFinalValue) != parseFloat(textRounderUpdater(newFinalValue))) {
            //   textRounderUpdater = function (value) {
            //     return parseFloat(value).toFixed(1);
            //   };
            // }
            // if (parseFloat(newFinalValue) != parseFloat(textRounderUpdater(newFinalValue))) {
            //   textRounderUpdater = function (value) {
            //     return parseFloat(value).toFixed(2);
            //   };
            // }
            //
            // var textTween = function () {
            //   var i = d3.interpolate(this.textContent, parseFloat(value).toFixed(2));
            //   return function (t) {
            //     this.textContent = textRounderUpdater(i(t)) + percentText;
            //   }
            // };
            //
            // text1.transition()
            //   .duration(config.waveRiseTime)
            //   .tween('text', textTween);
            // text2.transition()
            //   .duration(config.waveRiseTime)
            //   .tween('text', textTween);

            var fillPercent = Math.max(config.minValue, Math.min(config.maxValue, value)) / config.maxValue;
            var waveHeight = fillCircleRadius * waveHeightScale(fillPercent * 100);
            var waveRiseScale = d3.scaleLinear()
              // The clipping area size is the height of the fill circle + the wave height, so we position the clip wave
              // such that the it will overlap the fill circle at all when at 0%, and will totally cover the fill
              // circle at 100%.
              .range([(fillCircleMargin + fillCircleRadius * 2 + waveHeight), (fillCircleMargin - waveHeight)])
              .domain([0, 1]);
            var newHeight = waveRiseScale(fillPercent);
            var waveScaleX = d3.scaleLinear().range([0, waveClipWidth]).domain([0, 1]);
            var waveScaleY = d3.scaleLinear().range([0, waveHeight]).domain([0, 1]);
            var newClipArea;

            if (config.waveHeightScaling) {
              newClipArea = d3.area()
                .x(function (d) {
                  return waveScaleX(d.x);
                })
                .y0(function (d) {
                  return waveScaleY(Math.sin(Math.PI * 2 * config.waveOffset * -1 + Math.PI * 2 * (1 - config.waveCount) + d.y * 2 * Math.PI));
                })
                .y1(function (d) {
                  return (fillCircleRadius * 2 + waveHeight);
                });
            }
            else {
              newClipArea = clipArea;
            }

            var newWavePosition = config.waveAnimate ? waveAnimateScale(1) : 0;
            // wave.transition()
            //   .duration(0)
            //   .transition()
            //   .duration(config.waveAnimate ? (config.waveAnimateTime * (1 - wave.attr('T'))) : (config.waveRiseTime))
            //   .ease('linear')
            //   .attr('d', newClipArea)
            //   .attr('transform', 'translate(' + newWavePosition + ',0)')
            //   .attr('T', '1')
            //   .each('end', function () {
            //     if (config.waveAnimate) {
            //       wave.attr('transform', 'translate(' + waveAnimateScale(0) + ',0)');
            //       animateWave(config.waveAnimateTime);
            //     }
            //   });

            wave.transition()
              // .duration(config.waveAnimateTime * (1 - wave.attr('T')))
              .duration(config.waveAnimate ? (config.waveAnimateTime * (1 - wave.attr('T'))) : (config.waveRiseTime))
              .ease(d3.easeLinear)
              .attr('d', newClipArea) //
              .attr('transform', 'translate(' + newWavePosition + ',0)') //
              .attr('T', 1)
              .on('end', function () {
                wave.attr('T', 0);
                animateWave(config.waveAnimateTime);
              });

            waveGroup.transition()
              .duration(config.waveRiseTime)
              .attr('transform', 'translate(' + waveGroupXPosition + ',' + newHeight + ')');
          }
        }

        return new GaugeUpdater;
      }
    });
})();
