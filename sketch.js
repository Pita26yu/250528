// Hand Pose Detection with ml5.js
// https://thecodingtrain.com/tracks/ml5js-beginners-guide/ml5/hand-pose

let video;
let handPose;
let hands = [];

let fallingNumber = null;
let fallingY = 0;
let fallingX = 0;
let fallingSpeed = 1.85;     // 平穩掉落速度
let gravity = 0;             // 取消重力加速度
let lastSpawnTime = 0;
let score = 0;
let isWrong = false;

let videoW = 640;
let videoH = 480;
let scaleRatio = 0.9; // 改為90%
let displayW, displayH, offsetX, offsetY;

let wrongAnswers = []; // 儲存答錯的數字
let gameStartTime = 0;
let gameDuration = 60 * 1000; // 1分鐘
let gameFinished = false;

function preload() {
  // Initialize HandPose model with flipped video input
  handPose = ml5.handPose({ flipped: true });
}

function mousePressed() {
  console.log(hands);
}

function gotHands(results) {
  hands = results;
}

function spawnNumber() {
  fallingNumber = Math.floor(Math.random() * 100) + 1;
  fallingX = Math.random() * (videoW - 60) + 30;
  fallingY = 0;
  fallingSpeed = 1.85;
  isWrong = false;
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  video = createCapture(VIDEO, { flipped: true });
  video.size(videoW, videoH);
  video.hide();

  displayW = width * scaleRatio;
  displayH = height * scaleRatio;
  offsetX = (width - displayW) / 2;
  offsetY = (height - displayH) / 2;

  handPose.detectStart(video, gotHands);
  console.log("視訊鏡頭已啟動，請允許瀏覽器存取攝影機");
  spawnNumber();
  lastSpawnTime = millis();
  gameStartTime = millis();
}

function draw() {
  background(220);

  // 遊戲結束時顯示finish與錯誤答案
  if (gameFinished) {
    fill(0);
    textSize(64 * scaleRatio);
    textAlign(CENTER, CENTER);
    text("FINISH", width / 2, height / 2 - 60);

    fill(255, 0, 0);
    textSize(32 * scaleRatio);
    text("你答錯的數字：", width / 2, height / 2 + 10);
    let yOffset = height / 2 + 50;
    textSize(28 * scaleRatio);
    for (let i = 0; i < wrongAnswers.length; i++) {
      text(wrongAnswers[i], width / 2, yOffset);
      yOffset += 36;
    }
    return; // 停止遊戲畫面更新
  }

  // 視訊畫面置中且縮放
  image(video, offsetX, offsetY, displayW, displayH);

  // 將數字座標對應到縮放後的畫面
  let numX = offsetX + (fallingX / videoW) * displayW;
  let numY = offsetY + (fallingY / videoH) * displayH;

  // 處理掉落數字
  if (fallingNumber !== null) {
    fill(isWrong ? color(255, 0, 0) : color(0));
    textSize(48 * scaleRatio);
    textAlign(CENTER, CENTER);
    text(fallingNumber, numX, numY);

    if (numY < height) {
      fallingY += fallingSpeed;
    } else {
      // 記錄錯誤答案（只記一次）
      if (isWrong) {
        wrongAnswers.push(fallingNumber);
      }
      fallingY = ((height - offsetY) / displayH) * videoH;
      fallingSpeed = 1.85;
      spawnNumber();
      lastSpawnTime = millis();
    }
  }

  // 只繪製左右手食指紅點，並判斷奇偶
  if (hands.length > 0) {
    for (let hand of hands) {
      if (hand.confidence > 0.1 && hand.keypoints[8]) {
        let indexTip = hand.keypoints[8];
        let px = offsetX + (indexTip.x / videoW) * displayW;
        let py = offsetY + (indexTip.y / videoH) * displayH;
        fill(255, 0, 0);
        noStroke();
        circle(px, py, 32 * scaleRatio);

        // 點擊判斷
        if (fallingNumber !== null) {
          let d = dist(px, py, numX, numY);
          if (d < 40 * scaleRatio) {
            let lastDigit = fallingNumber % 10;
            let isEven = [0,2,4,6,8].includes(lastDigit);
            let isOdd = [1,3,5,7,9].includes(lastDigit);
            if ((hand.handedness === "Left" && isEven) ||
                (hand.handedness === "Right" && isOdd)) {
              score++;
              spawnNumber();
              lastSpawnTime = millis();
              break;
            } else {
              // 及時記錄錯誤答案（只記一次）
              if (!isWrong) {
                wrongAnswers.push(fallingNumber);
              }
              isWrong = true; // 答錯，數字變紅，但數字會繼續掉落到最底才消失
            }
          }
        }
      }
    }
  }

  // 分數顯示
  fill(0, 150, 0);
  textSize(32 * scaleRatio);
  textAlign(RIGHT, TOP);
  text("Score: " + score, width - 20, 20);

  // 遊戲時間到，結束遊戲
  if (millis() - gameStartTime > gameDuration) {
    gameFinished = true;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  displayW = width * scaleRatio;
  displayH = height * scaleRatio;
  offsetX = (width - displayW) / 2;
  offsetY = (height - displayH) / 2;
}
