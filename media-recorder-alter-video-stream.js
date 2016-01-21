// This example records an altered video stream with MediaRecorder, and uses
// the resulting blob as the source of a video tag.
// The altered video stream is generated by getting the user's camera video,
// render it to a canvas and apply a filter to it there.
//
// The relevant functions used are:
//
// navigator.mediaDevices.getUserMedia -> to get a video stream fromt the webcam
// requestAnimationFrame -> to create a render loop (better than setTimeout)
// CanvasRenderingContext2D.drawImage -> to draw the video stream
// CanvasRenderingContext2D.getImageData -> to read the canvas pixels
// CanvasRenderingContext2D.putImageData -> to write the canvas pixels
// CanvasRenderingContext2D.captureStream -> get a video stream from a canvas

var reccordButton, stopButton, recorder, recordingLabel;

window.onload = function () {
  recordButton = document.getElementById('record');
  stopButton = document.getElementById('stop');
  recordingLabel = document.getElementById('recording');

  recordButton.addEventListener('click', startRecording);
  stopButton.addEventListener('click', stopRecording);

  // get video stream from user's webcam
  navigator.mediaDevices.getUserMedia({
    video: true
  })
  .then(function (stream) {
    recordButton.disabled = false;


    // We need to create a video element and pipe the stream into it so we
    // can know when we have data in the stream, and its width/height
    // (and adjust the canvas element accordingly).
    // Note that this video doesn't need to be attached to the DOM for this
    // to work.
    var video = document.createElement('video');
    video.src = URL.createObjectURL(stream);
    video.addEventListener('loadedmetadata', function () {
      initCanvas(video);
    });
    // we need to play the video to trigger the loadedmetadata event
    video.play();
  });
};

function initCanvas(video) {
  var width = video.videoWidth;
  var height = video.videoHeight;

  // NOTE: In order to make the example more simple, we have opted to use a 2D
  //       context. In a real application, you should use WebGL to render the
  //       video and shaders to make filters, since it will be much faster.
  //       You can see an example of this in Boo!
  //       https://github.com/mozdevs/boo
  var canvas = document.getElementById('canvas');
  canvas.width = width;
  canvas.height = height;

  // use requestAnimationFrame to render the video as often as possible
  var ctx = canvas.getContext('2d', { preserveDrawingBuffer: true });
  var draw = function () {
    // create a renderAnimationFrame loop
    requestAnimationFrame(draw);
    // draw the video data into the canvas
    ctx.drawImage(video, 0, 0, width, height);
    // apply a custom filter to the image
    applyFilter(ctx, width, height);
  };

  draw();
  initRecorderWithCanvas(canvas);
}

function applyFilter(ctx, width, height) {
  // read pixels
  var imageData = ctx.getImageData(0, 0, width, height);
  var data = imageData.data; // data is an array of pixels in RGBA

  // modify pixels
  for (var i = 0; i < data.length; i+=4) {
    var average = (data[i] + data[i + 1]  + data[i + 2]) / 3;
    data[i] = average >= 128 ? 255 : 0; // red
    data[i + 1] = average >= 128 ? 255 : 0; // green
    data[i + 2] = average >= 128 ? 255 : 0; // blue
    // note: i+3 is the alpha channel, we are skipping that one
  }
  imageData.data = data;

  // render pixels back
  ctx.putImageData(imageData, 0, 0);
}

function initRecorderWithCanvas(canvas) {
  // create a new MediaRecorder and pipe the canvas stream to it
  var stream = canvas.captureStream(24); // build a 24 fps stream
  recorder = new MediaRecorder(stream);
  // listen to dataavailable, which gets triggered whenever we have
  // an audio blob available
  recorder.addEventListener('dataavailable', function (evt) {
    updateVideo(evt.data);
  });
}

function startRecording() {
  // enable/disable buttons
  recordButton.disabled = true;
  stopButton.disabled = false;
  recordingLabel.style = 'display:inline';

  // make the MediaRecorder to start recording
  recorder.start();
}

function stopRecording() {
  // enable/disable buttons
  recordButton.disabled = false;
  stopButton.disabled = true;
  recordingLabel.style = 'display:none';

  // make the MediaRecorder to stop recording
  // eventually this will trigger the dataavailable event
  recorder.stop();
}

function updateVideo(blob) {
  var video = document.getElementById('video');
  // use the blob from the MediaRecorder as source for the video tag
  video.src = URL.createObjectURL(blob);
  video.controls = true;
  video.play();
}
