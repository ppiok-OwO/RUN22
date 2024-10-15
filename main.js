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
let score = 0; // 현재 점수

/** 게임 변수 */
let timer = 0; // 장애물 생성 시간
let bulletArray = []; // 총알 배열
let enemyArray = []; // 적 배열
let gameOver = false; // 게임 종료 여부
let jump = false;
let jumpSpeed = 3; // 점프 속도

/** 오디오 객체 생성 및 설정 */
const jumpSound = new Audio(); // 점프 소리
jumpSound.src = "./sounds/jump.mp3";
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
    this.speed = 5;
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
const ENEMY_HEIGHT = 70;
const ENEMY_FREQUENCY = 90;
const ENEMY_SPEED = 2;
class Enemy {
  constructor() {
    this.x = canvas.width;
    this.y = Math.random() * (canvas.height - 30 - ENEMY_HEIGHT) + 30;
    this.width = ENEMY_WIDTH;
    this.height = ENEMY_HEIGHT;
    this.speed = ENEMY_SPEED;
  }

  draw() {
    ctx.drawImage(enemyImage, this.x, this.y, this.width, this.height);
  }

  update() {
    this.x -= this.speed;
  }
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
      timer = 0;
      gameOver = true;
      bgmSound.pause();
      defeatSound.play();
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
        score += 10;
        scoreText.innerHTML = "현재점수: " + score;
        scoreSound.pause();
        scoreSound.currentTime = 0;
        scoreSound.play();
      }
    });
  });

  /** 플레이어 그리기 */
  rtan.draw();

  if (jump) {
    rtan.y -= 3; // w 누르고 있으면 rtan의 y값 감소
    if (rtan.y < 20) rtan.y = 20; // rtan이 canvas 상단을 넘지 않도록 조정
  } else {
    if (rtan.y < RTAN_Y) {
      rtan.y += 3; // w 떼면 rtan의 y값 증가
      if (rtan.y > RTAN_Y) rtan.y = RTAN_Y; // rtan이 초기 위치 아래로 내려가지 않도록 조정
    }
  }
}

/** 키보드 이벤트 처리 (점프(W)) */
document.addEventListener("keydown", function (e) {
  if (e.code === "KeyW" && !jump) {
    jump = true; // w를 누르고 있을 때 점프 상태 유지
    jumpSound.play(); // 점프 소리 재생
  }
});
document.addEventListener("keyup", function (e) {
  if (e.code === "KeyW" && jump) {
    jump = false;
  }
});

/** 키보드 이벤트 처리 (스페이스 바 발사) */
document.addEventListener("keydown", function (e) {
  if (e.code === "Space") {
    const bullet = new Bullet(rtan.x + rtan.width / 2 - 5, rtan.y);
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
