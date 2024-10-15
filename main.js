/** 캔버스 설정 */
const canvas = document.getElementById("canvas"); // 캔버스 요소 가져오기
canvas.width = 800; // 캔버스 너비 설정
canvas.height = 500; // 캔버스 높이 설정
const ctx = canvas.getContext("2d"); // 2D 렌더링

/** 게임 상태 변수 */
let gameStarted = false; // 게임 시작 여부
const BG_MOVING_SPEED = 3; // 배경 이동 속도
let bgX = 0; // 배경 X 좌표
let scoreText = document.getElementById("score"); // 점수 표시 요소
let hpText = document.getElementById("hp");
let score = 0; // 현재 점수

/** 게임 변수 */
let timer = 0; // 장애물 생성 시간
let bulletArray = []; // 총알 배열
let enemyArray = []; // 적 배열
let gameOver = false; // 게임 종료 여부
let speed = 3;
const originalSpeed = 3; // 이동 속도
let stop = false;

/** 오디오 객체 생성 및 설정 */
/**TODO: 이동속도 사운드 넣기 */
const bgmSound = new Audio(); // 배경 음악
bgmSound.src = "./sounds/bgm.mp3";
const scoreSound = new Audio(); // 점수 획득 소리
scoreSound.src = "./sounds/score.mp3";
const defeatSound = new Audio(); // 게임 오버 소리
defeatSound.src = "./sounds/defeat1.mp3";
const bulletSound = new Audio();
bulletSound.src = "./sounds/laserGun.mp3";

/** 이미지 객체 생성 및 설정 */
// (1) 배경
const bgImage = new Image();
bgImage.src = "./images/background.png";
// (2) 게임 시작
const startImage = new Image();
startImage.src = "./images/gamestart.png";
// (3) 게임 오버
const gameoverImage = new Image();
gameoverImage.src = "./images/gameover.png";
// (4) 게임 재시작
const restartImage = new Image();
restartImage.src = "./images/restart.png";
// (5) 달리는 르탄이 A
const rtanAImage = new Image();
rtanAImage.src = "./images/rtan_running_a.png";
// (6) 달리는 르탄이 B
const rtanBImage = new Image();
rtanBImage.src = "./images/rtan_running_b.png";
// (7) 게임 오버 르탄이
const rtanCrashImage = new Image();
rtanCrashImage.src = "./images/rtan_crash.png";
// (8) 적
const enemyImage = new Image();
enemyImage.src = "./images/obstacle1.png";
// (9) 총알
const bulletImage = new Image();
bulletImage.src = "./images/obstacle3.png";

/** 1-1 플레이어 그리기 */
const RTAN_WIDTH = 100;
const RTAN_HEIGHT = 100;
const RTAN_X = 10;
const RTAN_Y = 400;

/** 플레이어 객체 정의 */
const rtan = {
  x: RTAN_X,
  y: RTAN_Y,
  hp: 100,
  width: RTAN_WIDTH,
  height: RTAN_HEIGHT,
  draw() {
    // 달리는 애니메이션 구현
    if (gameOver) {
      // 게임 오버 시 충돌 이미지 그리기
      ctx.drawImage(rtanCrashImage, this.x, this.y, this.width, this.height);
    } else {
      // 달리는 애니메이션 구현
      if (timer % 60 > 30) {
        ctx.drawImage(rtanAImage, this.x, this.y, this.width, this.height);
      } else {
        ctx.drawImage(rtanBImage, this.x, this.y, this.width, this.height);
      }
    }
  },
};

/** 총알 클래스 정의 */

class Bullet {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 30;
    this.speed = 7;
  }

  draw() {
    ctx.drawImage(bulletImage, this.x, this.y, this.width, this.height);
  }

  update() {
    this.x += this.speed;
  }
}

/** 적 클래스 정의 */
const ENEMY_WIDTH = 70;
const ENEMY_FREQUENCY = 90;
const ENEMY_SPEED = 2;

class Enemy {
  constructor() {
    let IsCrashed = false;
    let ENEMY_HEIGHT = Math.random() * (100 - 30) + 30;
    let ENEMY_Y = Math.random() * (canvas.height - 50 - ENEMY_HEIGHT) + 30;

    this.x = canvas.width;
    this.y = ENEMY_Y;
    this.width = 70;
    this.height = ENEMY_HEIGHT;
    this.speed = 100 / ENEMY_HEIGHT;
    this.IsCrashed = false;
    this.enemyScore = ENEMY_HEIGHT / 2;
  }

  draw() {
    ctx.drawImage(enemyImage, this.x, this.y, this.width, this.height);
  }

  update() {
    this.x -= this.speed;
  }
}

/** 키보드 입력 저장하기 */
let keyPresses = {};

window.addEventListener("keydown", keyDownListener, false);
function keyDownListener(event) {
  keyPresses[event.key] = true;
}

window.addEventListener("keyup", keyUpListener, false);
function keyUpListener(event) {
  keyPresses[event.key] = false;
}

/** 3-1 배경 화면 그리기 */
function backgroundImg(bgX) {
  ctx.drawImage(bgImage, bgX, 0, canvas.width, canvas.height);
}
// 시작 화면 그리기
function drawStartScreen() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  backgroundImg(0);
  const imageWidth = 473;
  const imageHeight = 316;
  const imageX = canvas.width / 2 - imageWidth / 2;
  const imageY = canvas.height / 2 - imageHeight / 2;
  ctx.drawImage(startImage, imageX, imageY, imageWidth, imageHeight);
}

// 게임 오버 화면 그리기
function drawGameOverScreen() {
  ctx.drawImage(gameoverImage, canvas.width / 2 - 100, canvas.height / 2 - 50, 200, 100);
  ctx.drawImage(restartImage, canvas.width / 2 - 50, canvas.height / 2 + 50, 100, 50);
}

//이미지 로딩 완료 시 게임 시작 화면 그리기
let bgImageLoaded = new Promise((resolve) => {
  bgImage.onload = resolve;
});

let startImageLoaded = new Promise((resolve) => {
  startImage.onload = resolve;
});

Promise.all([bgImageLoaded, startImageLoaded]).then(drawStartScreen);

/** 게임 애니메이션 함수 */
function animate() {
  if (gameOver) {
    drawGameOverScreen();
    return;
  }

  // 타이머 증가 및 다음 프레임 요청
  requestAnimationFrame(animate);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  timer++;

  /** 배경 이미지 */
  // 3-1 배경 이미지 그리기 (무한 스크롤 효과)
  backgroundImg(bgX);
  backgroundImg(bgX + canvas.width);
  bgX -= BG_MOVING_SPEED;
  if (bgX < -canvas.width) bgX = 0;
  // 배경 음악 재생
  bgmSound.play();
  /** end of 배경 이미지 */

  /** 적 생성 및 업데이트 */
  if (timer % ENEMY_FREQUENCY === 0) {
    const enemy = new Enemy();
    enemyArray.push(enemy);
  }

  enemyArray.forEach((enemy) => {
    enemy.draw();
    enemy.update();
    enemy.x -= ENEMY_SPEED;
    if (enemy.x < -ENEMY_WIDTH) {
      enemyArray.shift(); // 장애물 제거
    }
    // 충돌 검사
    if (collision(rtan, enemy)) {
      if (!enemy.IsCrashed) {
        rtan.hp -= 10;
        enemy.IsCrashed = true;
        hpText.innerHTML = rtan.hp;
        if (rtan.hp <= 0) {
          timer = 0;
          gameOver = true;
          drawGameOverScreen();
          bgmSound.pause();
          defeatSound.play();
        }
      }
    }
  });

  /** 발사체 그리기 및 업데이트 */
  bulletArray.forEach((bullet, bulletIndex) => {
    bullet.draw();
    bullet.update();
    if (bullet.x > canvas.width) bulletArray.splice(bulletIndex, 1);

    // 발사체와 적 충돌 검사
    enemyArray.forEach((enemy, enemyIndex) => {
      if (collision(bullet, enemy)) {
        enemyArray.splice(enemyIndex, 1);
        bulletArray.splice(bulletIndex, 1);
        score += Math.floor(enemy.enemyScore);
        scoreText.innerHTML = "현재점수: " + score;
        scoreSound.pause();
        scoreSound.currentTime = 0;
        scoreSound.play();
      }
    });
  });

  // 상하좌우로 이동하기
  if (keyPresses.w || keyPresses.W) {
    rtan.y -= speed;
    if (rtan.y < 20) rtan.y = 20;
  } else if (keyPresses.s || keyPresses.S) {
    rtan.y += speed;
    if (rtan.y > RTAN_Y) rtan.y = RTAN_Y;
  } else if (keyPresses.a || keyPresses.A) {
    rtan.x -= speed;
    if (rtan.x < -rtan.width) rtan.x = 0;
  } else if (keyPresses.d || keyPresses.D) {
    rtan.x += speed;
    if (rtan.x > canvas.width) rtan.x = canvas.width - rtan.width;
  }

  // 대각선으로 이동하기
  if ((keyPresses.w || keyPresses.W) && (keyPresses.a || keyPresses.A)) {
    rtan.x -= speed;
    rtan.y -= speed;
    if (rtan.x < -rtan.width) rtan.x = 0;
    if (rtan.y < 20) rtan.y = 20;
  } else if ((keyPresses.w || keyPresses.W) && (keyPresses.d || keyPresses.D)) {
    rtan.x += speed;
    rtan.y -= speed;
    if (rtan.x > canvas.width) rtan.x = canvas.width - rtan.width;
    if (rtan.y < 20) rtan.y = 20;
  } else if ((keyPresses.s || keyPresses.S) && (keyPresses.a || keyPresses.A)) {
    rtan.x -= speed;
    rtan.y += speed;
    if (rtan.x < -rtan.width) rtan.x = 0;
    if (rtan.y > RTAN_Y) rtan.y = RTAN_Y;
  } else if ((keyPresses.s || keyPresses.S) && (keyPresses.d || keyPresses.D)) {
    rtan.x += speed;
    rtan.y += speed;
    if (rtan.x > canvas.width) rtan.x = canvas.width - rtan.width;
    if (rtan.y > RTAN_Y) rtan.y = RTAN_Y;
  }
  /** 플레이어 그리기 */
  rtan.draw();
}

// /** 키보드 이벤트 처리(위로 이동)) */
// document.addEventListener("keypress", function (e) {
//   if (e.code === "KeyW") {
//     rtan.y -= speed; // w 누르고 있으면 rtan의 y값 감소
//     if (rtan.y < 20) rtan.y = 20;
//   }
// });

// /** 키보드 이벤트 처리(아래로 이동) */
// document.addEventListener("keypress", function (e) {
//   if (e.code === "KeyS") {
//     rtan.y += speed; // w 누르고 있으면 rtan의 y값 증가
//     if (rtan.y > RTAN_Y) rtan.y = RTAN_Y;
//   }
// });

/** 키보드 이벤트 처리 (스페이스 바 발사) */
/** 총알 발사 딜레이 주기 */
window.addEventListener("keypress", function (e) {
  if (e.code === "Space") {
    const bullet = new Bullet(rtan.x + rtan.width / 2, rtan.y + rtan.height/2);
    bulletArray.push(bullet);
    bulletSound.currentTime = 0;
    bulletSound.play();
  }
});

/** 충돌 체크 함수 */
function collision(obj1, obj2) {
  return !(obj1.x > obj2.x + obj2.width || obj1.x + obj1.width < obj2.x || obj1.y > obj2.y + obj2.height || obj1.y + obj1.height < obj2.y);
}

/** 3-3 게임 시작 조건 설정하기 */
canvas.addEventListener("click", function (e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // 게임 시작
  if (!gameStarted && x >= 0 && x <= canvas.width && y >= 0 && y <= canvas.height) {
    gameStarted = true;
    animate();
  }

  // 게임 재시작 버튼 클릭
  if (gameOver && x >= canvas.width / 2 - 50 && x <= canvas.width / 2 + 50 && y >= canvas.height / 2 + 50 && y <= canvas.height / 2 + 100) {
    restartGame();
  }
});

/** 게임 재시작 함수 */
function restartGame() {
  gameOver = false;
  bulletArray = [];
  enemyArray = [];
  timer = 0;
  score = 0;
  scoreText.innerHTML = "현재점수: " + score;
  rtan.x = 10;
  rtan.y = 400;
  animate();
}
