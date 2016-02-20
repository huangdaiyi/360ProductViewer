
;(function($) {
$.fn.productViewer = function(options) {
	options = $.extend({
			spin:".range",
			zoomAdd:".zoom .add", 
			zoomSub:".zoom .sub",
			zoomReset:".zoom .reset",
            speed: 1, //旋转速度 
            currentImage:1, //当前图片
            imageCount:20, //图片总数量
            baseName:"images/z3d/small/images ", //图片baseurl
            imageType:".jpg", //图片类型
            width:660,   //初始化图片宽
            height:500,  //初始化图片高
            maxZoomCount:2, //最大请求服务器放大次数
            zoomTime : 1.5, //放大倍数
            zoomSpeed : 400,
            forceSize:false //强制设置图片的大小为容器的宽度
        }, options);

	if(options.imageCount==0) return;

	var $imagePanel = this.find(".image-panel"),
	$spin = this.find(options.spin),
	$zoomAdd = this.find(options.zoomAdd),
	$zoomSub = this.find(options.zoomSub),
	$zoomReset = this.find(options.zoomReset),
	$viewer = this;

	this.on("init_viewer:before", function(){
		show_loading();
	});

	this.on("init_viewer:loading", function(event, loaded, total){
		$loading = $viewer.find("#viewer_loading");
		$loading.find("em").html(Math.ceil(100*loaded/total) + "%");
	});

	this.on("init_viewer:end", function(){
		$viewer.find("#viewer_loading").hide();
		$viewerImage.show();
	});

	var wrapWitdh = $imagePanel.width(), 
	wrapHeight = $imagePanel.height();

	var loaded =_initImages();

	var $viewerImage = $('<img />');
	
	$viewerImage.attr("src", _buildImageSrc(options.currentImage) + _imageQuery(options.width, options.height));
	if(options.forceSize){
		$viewerImage.css({"width":wrapWitdh, "height":wrapHeight});
	}else{
		offsetLeft = (wrapWitdh - options.width)/2;
		offsetTop = (wrapHeight - options.height)/2;
	}
	$viewerImage.hide();
	$viewerImage.appendTo($imagePanel);

	var zoomCount = 0,
	drag = false, 
	move = false,
	position = {"x":0, "y": 0},
	offsetLeft = 0,
	offsetTop = 0,
	dragPackage = {"drag":false, "left":0, "top":0};

	this.show();

	$imagePanel.show();
	
	if(!options.forceSize){
		offsetLeft = (wrapWitdh - options.width)/2;
		offsetTop = (wrapHeight - options.height)/2;
	}

	$viewerImage.css({"top":offsetTop, "left": offsetLeft});

	function _change(from, to){

		if (from == to) return;

		var speed = options.speed,
		_loaded = loaded;

		window.setTimeout(function(){
			if(from != to){
				console.log("from: "+ from + ", to:" + to)
				if(from > to){
					from = from - 1;
				}else{
					from = from + 1;
				}
				_loadedData = _loaded[from - 1] 			
				$viewerImage.attr("src", _buildImageSrc(from) + _imageQuery(_loadedData.width, _loadedData.height));
				_change(from, to);
			}
		}, speed);

	};

	function _initImages(){
		var imageCount = options.imageCount;
		var iLoaded=1;
		var _$viewer = $viewer;
		var width = options.width;
		var height = options.height;
		var imageQuery = _imageQuery(width, height);
		var loaded = [];
		_$viewer.trigger("init_viewer:before");
		for(var i=1; i<=imageCount; i++)
		{
			var oNewImg=new Image();
			oNewImg.onload=function ()
			{
				_$viewer.trigger("init_viewer:loading", [iLoaded, imageCount]);			
				if(++iLoaded==imageCount){
					_$viewer.trigger("init_viewer:end");
				}
			};
			oNewImg.src= _buildImageSrc(i) + imageQuery;
			loaded[i-1] = {"width":width, "height": height, "loadCount" : 1};
		}
		return loaded;
	};

	function _buildImageSrc(imageIndex){
		var _options = options;
		return _options.baseName + imageIndex + _options.imageType;
	};

	function _imageQuery(width, height){
		return "?w="+width+"&h=" + height;
	};

	function _resize(new_width, new_height, add){
		var left = (wrapWitdh - new_width)/2,
		top = (wrapHeight - new_height)/2, 
		_options = options;

		if(dragPackage.drag){
			if(add){
				left = dragPackage.left * _options.zoomTime;
				top = dragPackage.top * _options.zoomTime;
			}else{
				left = dragPackage.left / _options.zoomTime;
				top = dragPackage.top / _options.zoomTime;
			}
			dragPackage.left = left;
			dragPackage.top = top;
		}

		$viewerImage.animate({"height":new_height, "width":new_width, "left": left, "top":top}, _options.zoomSpeed, function(){
			_change_current();
		});
		
	};

	function _change_current(){

		var $current = $viewerImage,
		width = $current.width(),
		height = $current.height(),
		_options = options,
		currentLoaded = loaded[_options.currentImage - 1];

		if(currentLoaded.loadCount > _options.maxZoomCount){
			return;
		}

		if(currentLoaded.height < height || currentLoaded.width < width){
			var oldSrc = $current.attr("src");
			var newImage = $current.clone()[0];
			newImage.onload = _loadFun(_options.currentImage, width, height);
			newImage.src =  oldSrc.substring(0, oldSrc.indexOf("?")) + _imageQuery(width, height);

			currentLoaded.width = width;
			currentLoaded.height = height;
			currentLoaded.loadCount += 1;
		}

	};

	function _loadFun(currentImage, width, height){
		return function(){
			if (currentImage == options.currentImage){
					$viewerImage.attr("src", this.src);
				}
			}; 
	};

	//init slider value
	$spin.attr("min", 1).attr("max", options.imageCount).val(options.currentImage);

	$spin.on("input", function(){
		var targetStep = parseInt(this.value);
		var currentStep = options.currentImage;

		_change(currentStep, targetStep);
		options.currentImage = targetStep;
		
	});

	$spin.on("change", function(){
		_change_current();
	});

	$viewerImage.on("click", function(){
		$zoomAdd.trigger("click");
	});

	$zoomAdd.on("click", function(){
		var $img = $viewerImage,
		new_width = $img.width()* options.zoomTime,
			new_height = $img.height()*options.zoomTime;
		_resize(new_width, new_height, true);
		zoomCount++;
		
	});

	$zoomSub.on("click", function(){

		if(zoomCount < 1) 
			return;

		if(zoomCount == 1){
			$zoomReset.trigger("click");
			return;
		}

		var $img = $viewerImage,
			new_width = $img.width()/options.zoomTime,
			new_height = $img.height()/options.zoomTime;
		_resize(new_width, new_height);
		zoomCount--;
		
	});

	$zoomReset.on("click", function(){
		var _options = options;
		dragPackage.drag = false;
		var height, width;
		// _resize(_options.width, _options.height);
		if(_options.forceSize){
			height = wrapHeight;
			width = wrapWitdh;
		}else{
			height = _options.height;
			width = _options.width;
		}
		$viewerImage.animate({"height":height, "width":width, "left": offsetLeft, "top": offsetTop}, _options.zoomSpeed);
		zoomCount = 0;
	});

	
	
	function show_loading(){
		var _$viewer = $viewer;
		_$viewer.append()
		var $loading = _$viewer.find("#viewer_loading");
		if($loading.length == 0){
			$loading = $('<div id="viewer_loading" class="loading"><img src="images/loading.gif" /><em>0%</em></div>')
			_$viewer.append($loading);
		}
		$loading.show();
	};

	$imagePanel.on("mousedown", "img", function(event){
		if (drag && moveabel()){
			var wrapPos = $imagePanel.offset(),
			currentPos = $(this).position(),
			mousePos = getMousePos(event);
			position.x = mousePos.x - wrapPos.left - currentPos.left;
			position.y = mousePos.y - wrapPos.top - currentPos.top;
			$viewerImage.css("cursor", "move");
			move = true;
		}
	});

	$imagePanel.on("mouseup", function(){
		move = false;
		$viewerImage.css("cursor", "");
	});

	$imagePanel.on("mouseover", "img", function(){
		drag = true;
	});

	$imagePanel.on("mousemove", "img", function(event){
		mousePos = getMousePos(event),
		wrapPos = $imagePanel.offset();
		if(move && detectLeftButton(event) && moveabel()){
			dragPackage.drag = true;
			dragPackage.top = mousePos.y - wrapPos.top - position.y;
			dragPackage.left = mousePos.x - wrapPos.left - position.x;
			$viewerImage.css({"top": dragPackage.top, "left": dragPackage.left});
		}else{
			$viewerImage.css("cursor", "");
		}
		
	});

	function moveabel(){
		return zoomCount > 0;
	};

	$imagePanel.on("dragstart", function(){
		return false;
	});

	function getMousePos(e) {
	    e = e || window.event;
	    var x = e.pageX || (e.clientX + (document.documentElement.scrollLeft || document.body.scrollLeft));
	    var y= e.pageY || (e.clientY + (document.documentElement.scrollTop || document.body.scrollTop));
	    return {'x':x,'y':y};
	  }

	function detectLeftButton(evt) {
	    evt = evt || window.event;
	    var button = evt.which || evt.button;
	    return button == 1;
	}
};
})(jQuery);
