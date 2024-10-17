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
let lastFrameTime = 0; // 마지막 프레임 시간
let deltaTime;
let gameTimer = 0;
let itemTimer = 0;
let accumulatedTime = 0;
let bulletArray = []; // 총알 배열
let enemyArray = []; // 적 배열
let hpPotionArray = []; // HP포션 배열
let lastBulletTime = 0;
let gameOver = false; // 게임 종료 여부
const maxHp = 100;
const maxRage = 100;

/** 오디오 객체 생성 및 설정 */
const bgmSound = new Audio(); // 배경 음악
bgmSound.src = "./sounds/bgm.mp3";
const scoreSound = new Audio(); // 점수 획득 소리
scoreSound.src = "./sounds/score.mp3";
const defeatSound = new Audio(); // 게임 오버 소리
defeatSound.src = "./sounds/defeat1.mp3";
const bulletSound = new Audio(); // 총소리
bulletSound.src = "./sounds/PewPewSound.mp3";
const getItemSound = new Audio(); // 아이템 획득 효과음
getItemSound.src = "./sounds/Ascending7.mp3";

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
// (10) HP 포션
const HPpotionImage = new Image();
HPpotionImage.src = "./images/HpPotion.png";

/** 1-1 플레이어 그리기 */
const RTAN_WIDTH = 100;
const RTAN_HEIGHT = 100;
const RTAN_X = 10;
const RTAN_Y = 400;
let speed = 3; // 캐릭터 속도

/** 플레이어 객체 정의 */
const rtan = {
  x: RTAN_X,
  y: RTAN_Y,
  hp: 100,
  width: RTAN_WIDTH,
  height: RTAN_HEIGHT,
  Israge: false,
  draw() {
    // 달리는 애니메이션 구현
    if (gameOver) {
      // 게임 오버 시 충돌 이미지 그리기
      ctx.drawImage(rtanCrashImage, this.x, this.y, this.width, this.height);
    } else {
      // 달리는 애니메이션 구현
      if (accumulatedTime % 2 > 1) {
        ctx.drawImage(rtanAImage, this.x, this.y, this.width, this.height);
      } else {
        ctx.drawImage(rtanBImage, this.x, this.y, this.width, this.height);
      }
    }
  },
};

/** HP바 정의 */
// HP바 너비 계수
const HP_BAR_WIDTH_COEFF = 2;

const HP_bar = {
  x: 20,
  y: 20,
  max_width: maxHp * HP_BAR_WIDTH_COEFF,
  width: maxHp * HP_BAR_WIDTH_COEFF,
  height: 30,
  drawBG() {
    ctx.fillStyle = "#F5F5F5";
    ctx.fillRect(this.x, this.y, this.max_width, this.height);
  },
  draw() {
    const my_gradient = ctx.createLinearGradient(0, this.y, 0, this.y + this.height); // gradient
    my_gradient.addColorStop(0, "#800000");
    my_gradient.addColorStop(0.5, "#FF0000");
    my_gradient.addColorStop(1, "#FF7F50");
    ctx.fillStyle = my_gradient;
    ctx.strokeStyle = "black";
    ctx.lineWidth = 3;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.strokeRect(this.x, this.y, this.max_width, this.height);
  },
};

/** 폭주 게이지바 정의 */
// 폭주 게이지바 너비 계수
const GAGE_BAR_WIDTH_COEFF = 2;
let GAGE_BAR_WIDTH = maxRage * GAGE_BAR_WIDTH_COEFF;
let RAGE_GAGE = 0;

const GAGE_bar = {
  x: 20,
  y: 60,
  max_width: maxRage * GAGE_BAR_WIDTH_COEFF,
  width: maxRage * GAGE_BAR_WIDTH_COEFF,
  height: 20,
  drawBG() {
    ctx.fillStyle = "#F5F5F5";
    ctx.fillRect(this.x, this.y, this.max_width, this.height);
  },
  draw() {
    const my_gradient = ctx.createLinearGradient(0, this.y, 0, this.y + this.height); // gradient
    my_gradient.addColorStop(0, "#FF8C00");
    my_gradient.addColorStop(0.5, "#FFA500");
    my_gradient.addColorStop(1, "#FFD700");
    ctx.fillStyle = my_gradient;
    ctx.strokeStyle = "black";
    ctx.lineWidth = 3;
    ctx.fillRect(this.x, this.y, RAGE_GAGE, this.height);
    ctx.strokeRect(this.x, this.y, this.max_width, this.height);
  },
};

/** 총알 클래스 정의 */
class Bullet {
  constructor() {
    this.x = rtan.x + rtan.width;
    this.y = rtan.y + rtan.height / 2;
    this.width = 30;
    this.height = 30;
    this.speed = 4;
  }
  draw() {
    ctx.drawImage(bulletImage, this.x, this.y, this.width, this.height);
  }
  update() {
    this.x += this.speed;
  }
}

class Bullet2 {
  constructor() {
    this.x = rtan.x + rtan.width;
    this.y = rtan.y + rtan.height / 2;
    this.width = 30;
    this.height = 30;
    this.speed = 4;
  }
  draw() {
    ctx.drawImage(bulletImage, this.x, this.y, this.width, this.height);
  }
  update() {
    this.x += this.speed;
    this.y += this.speed / 2;
  }
}

class Bullet3 {
  constructor() {
    this.x = rtan.x + rtan.width;
    this.y = rtan.y + rtan.height / 2;
    this.width = 30;
    this.height = 30;
    this.speed = 4;
  }
  draw() {
    ctx.drawImage(bulletImage, this.x, this.y, this.width, this.height);
  }
  update() {
    this.x += this.speed;
    this.y -= this.speed / 2;
  }
}

/** 적 클래스 정의 */
const ENEMY_FREQUENCY = 0.5;
class Enemy {
  constructor() {
    let ENEMY_SIZE = Math.random() * (100 - 30) + 30;
    let ENEMY_Y = Math.random() * (canvas.height - 50 - ENEMY_SIZE) + 30;

    this.x = canvas.width;
    this.y = ENEMY_Y;
    this.width = ENEMY_SIZE;
    this.height = ENEMY_SIZE;
    this.speed = 450 / ENEMY_SIZE;
    this.IsCrashed = false;
    this.enemyScore = ENEMY_SIZE / 2;
  }
  draw() {
    ctx.drawImage(enemyImage, this.x, this.y, this.width, this.height);
  }
  update() {
    this.x -= this.speed;
  }
}

/** HP Potion 정의 */
const HPPOTION_FREQUENCY = 5;
class HpPotion {
  constructor() {
    let HPPOTION_Y = Math.random() * (canvas.height - 50 - 30) + 30;

    this.x = canvas.width;
    this.y = HPPOTION_Y;
    this.width = 50;
    this.height = 50;
    this.speed = 5;
    this.healingValue = 10;
    this.IsConsumed = false;
  }
  draw() {
    ctx.drawImage(HPpotionImage, this.x, this.y, this.width, this.height);
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
function animate(frameTime) {
  if (gameOver) {
    drawGameOverScreen();
    return;
  }

  // 타이머 증가 및 다음 프레임 요청
  requestAnimationFrame(animate); // 1프레임당 걸리는 시간을 animate 함수의 인자로 반환시켜 준다.

  deltaTime = (frameTime - lastFrameTime) / 1000; // frameTime - lastFrameTime : 1프레임당 걸리는 시간(밀리초)
  lastFrameTime = frameTime; // ((frameTime - lastFrameTime) / 1000): 1프레임당 걸린 시간을 초 단위로 변환
  accumulatedTime += deltaTime; // 총 누적 시간
  gameTimer += deltaTime; // 오브젝트 생성용 타이머
  itemTimer += deltaTime; // 아이템 생성용 타이머

  ctx.clearRect(0, 0, canvas.width, canvas.height); // 생성한 프레임 캔버스 크기만큼 지워주기

  /** 배경 이미지 */
  // 3-1 배경 이미지 그리기 (무한 스크롤 효과)
  backgroundImg(bgX);
  backgroundImg(bgX + canvas.width);
  bgX -= BG_MOVING_SPEED * deltaTime * 60;
  if (bgX < -canvas.width) bgX = 0;
  // 배경 음악 재생
  bgmSound.play();
  /** end of 배경 이미지 */

  /** 적 생성 및 업데이트 */
  if (gameTimer >= ENEMY_FREQUENCY) {
    // 0.5초마다 적 생성
    const enemy = new Enemy();
    enemyArray.push(enemy);
    gameTimer = 0;
  }
  enemyArray.forEach((enemy) => {
    enemy.draw();
    enemy.update();
    if (enemy.x < -enemy.ENEMY_SIZE) {
      enemyArray.shift(); // 장애물 제거
    }
    // 충돌 검사
    if (collision(rtan, enemy)) {
      if (!enemy.IsCrashed) {
        rtan.hp -= 10;
        HP_bar.width -= 10 * HP_BAR_WIDTH_COEFF;
        enemy.IsCrashed = true;
        hpText.innerHTML = "HP : " + rtan.hp;
        if (rtan.hp <= 0) {
          accumulatedTime = 0;
          gameOver = true;
          drawGameOverScreen();
          bgmSound.pause();
          defeatSound.play();
        }
      }
    }
  });

  /** HP 포션 생성 및 업데이트 */
  if (itemTimer >= HPPOTION_FREQUENCY) {
    const hppotion = new HpPotion();
    hpPotionArray.push(hppotion);
    itemTimer = 0;
  }
  hpPotionArray.forEach((hppotion, hppotionIndex) => {
    hppotion.draw();
    hppotion.update();
    if (hppotion.x < 0) {
      hpPotionArray.shift();
    }
    // HP 포션 객체들 충돌 검사
    if (collision(rtan, hppotion)) {
      if (!hppotion.IsConsumed) {
        hppotion.IsConsumed = true;
        hpPotionArray.splice(hppotionIndex, 1);
        rtan.hp += hppotion.healingValue;
        HP_bar.width += hppotion.healingValue * HP_BAR_WIDTH_COEFF;

        if (rtan.hp > maxHp) {
          rtan.hp = maxHp;
          HP_bar.width = maxHp * HP_BAR_WIDTH_COEFF;
          hpText.innerHTML = "HP : " + rtan.hp;
        } else {
          hpText.innerHTML = "HP : " + rtan.hp;
          getItemSound.pause();
          getItemSound.currentTime = 0;
          getItemSound.play();
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
        // 충돌한 총알과 적 오브젝트 없애기
        enemyArray.splice(enemyIndex, 1);
        bulletArray.splice(bulletIndex, 1);
        // 점수 증가 및 표시
        score += Math.floor(enemy.enemyScore);
        scoreText.innerHTML = "현재점수: " + score;
        scoreSound.pause();
        scoreSound.currentTime = 0;
        scoreSound.play();
        // 폭주 상태가 아니라면 게이지 증가
        if (!rtan.Israge) {
          RAGE_GAGE += Math.floor(enemy.enemyScore) / 3;
        }
      }
    });
  });

  // 폭주 모드에 진입해도 괜찮은지 검사
  if (RAGE_GAGE >= GAGE_bar.max_width && !rtan.Israge) {
    // 폭주 게이지가 최대치를 넘지 않게 조정
    RAGE_GAGE = GAGE_bar.max_width;
    rtan.Israge = true;
  }

  // 폭주 모드에 진입하면 프레임당 게이지가 0.7씩 깎인다. 0이하가 되면 폭주가 끝난다.
  if (rtan.Israge) {
    RAGE_GAGE -= 0.7;
    if (RAGE_GAGE <= 0) {
      RAGE_GAGE = 0;
      rtan.Israge = false;
    }
  }

  // 상하좌우로 이동하기
  if (keyPresses.w || keyPresses.W) {
    rtan.y -= speed * deltaTime * 60;
    if (rtan.y < 20) rtan.y = 20;
  } else if (keyPresses.s || keyPresses.S) {
    rtan.y += speed * deltaTime * 60;
    if (rtan.y > RTAN_Y) rtan.y = RTAN_Y;
  } else if (keyPresses.a || keyPresses.A) {
    rtan.x -= speed * deltaTime * 60;
    if (rtan.x < -rtan.width) rtan.x = 0;
  } else if (keyPresses.d || keyPresses.D) {
    rtan.x += speed * deltaTime * 60;
    if (rtan.x > canvas.width) rtan.x = canvas.width - rtan.width;
  }

  // 대각선으로 이동하기
  if ((keyPresses.w || keyPresses.W) && (keyPresses.a || keyPresses.A)) {
    rtan.x -= speed * deltaTime * 60;
    rtan.y -= speed * deltaTime * 60;
    if (rtan.x < -rtan.width) rtan.x = 0;
    if (rtan.y < 20) rtan.y = 20;
  } else if ((keyPresses.w || keyPresses.W) && (keyPresses.d || keyPresses.D)) {
    rtan.x += speed * deltaTime * 60;
    rtan.y -= speed * deltaTime * 60;
    if (rtan.x > canvas.width) rtan.x = canvas.width - rtan.width;
    if (rtan.y < 20) rtan.y = 20;
  } else if ((keyPresses.s || keyPresses.S) && (keyPresses.a || keyPresses.A)) {
    rtan.x -= speed * deltaTime * 60;
    rtan.y += speed * deltaTime * 60;
    if (rtan.x < -rtan.width) rtan.x = 0;
    if (rtan.y > RTAN_Y) rtan.y = RTAN_Y;
  } else if ((keyPresses.s || keyPresses.S) && (keyPresses.d || keyPresses.D)) {
    rtan.x += speed * deltaTime * 60;
    rtan.y += speed * deltaTime * 60;
    if (rtan.x > canvas.width) rtan.x = canvas.width - rtan.width;
    if (rtan.y > RTAN_Y) rtan.y = RTAN_Y;
  }

  // 스페이스바(공백)를 누를 시 총알 발사
  if (keyPresses[" "]) {
    let currentTime = accumulatedTime; // 총 누적 시간을 현재 시간 변수에 할당
    if (currentTime - lastBulletTime >= 0.3) {
      // 현재시간-마지막 발사 시간이 0.3초 이상일 때만 총알 객체 생성하기(사격의 딜레이를 주기 위함)
      const bullet = new Bullet();
      bulletArray.push(bullet);
      bulletSound.currentTime = 0;
      bulletSound.play();
      lastBulletTime = currentTime;
      // 폭주 모드일 때 총알 두 개 추가
      if (rtan.Israge) {
        const bullet2 = new Bullet2();
        const bullet3 = new Bullet3();

        bullet2.draw();
        bullet2.update();
        bullet3.draw();
        bullet3.update();

        bulletArray.push(bullet2);
        bulletArray.push(bullet3);
        bulletSound.currentTime = 0;
        bulletSound.play();
      }
      // 총알이 캔버스 바깥으로 나가면 삭제하기
      if (bullet.x > canvas.width || bullet.x < 0 || bullet.y > canvas.height || bullet.y < 0) bulletArray.splice(bulletIndex, 1);
    }
  }
  /** 플레이어, HP바, 게이지바 그리기 */
  rtan.draw();
  HP_bar.drawBG();
  HP_bar.draw();
  GAGE_bar.drawBG();
  GAGE_bar.draw();
}

/** 충돌 체크 함수 */
function collision(obj1, obj2) {
  return !(obj1.x > obj2.x + obj2.width || obj1.x + obj1.width < obj2.x || obj1.y > obj2.y + obj2.height || obj1.y + obj1.height < obj2.y);
}

/** 3-3 게임 시작 조건 설정하기 */
canvas.addEventListener("click", function (e) {
  // Element.getBoundingClientRect(): 어떤 요소의 화면상에서 위치와 크기를 구하는 메서드.
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left; // 캔버스 (0, 0)기준 클릭한 지점의 x좌표
  const y = e.clientY - rect.top; // 캔버스 (0, 0) 기준 클릭한 지점의 y좌표

  // 게임 시작
  if (!gameStarted && x >= 0 && x <= canvas.width && y >= 0 && y <= canvas.height) {
    gameStarted = true;
    requestAnimationFrame(animate);
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
  rtan.hp = maxHp;
  HP_bar.width = 100 * HP_BAR_WIDTH_COEFF;
  RAGE_GAGE = 0;
  accumulatedTime = 0;
  lastFrameTime = 0;
  gameTimer = 0;
  score = 0;
  currentTime = 0;
  scoreText.innerHTML = "현재점수: " + score;
  hpText.innerHTML = "HP: " + maxHp;
  rtan.x = 10;
  rtan.y = 400;
  requestAnimationFrame(animate);
}
