//問題を解く機能：クイズ機能
<script setup>
import { ref, onMounted, computed, watch } from 'vue'

// 親(App.vue)から「カテゴリ名」を受け取る設定
const props = defineProps(['category'])
// 親に「メニューに戻る」と伝えるための設定
const emit = defineEmits(['back'])

// 問題データを格納する箱
const questions = ref([])
const loading = ref(false)
const initialTotalCount = ref(0)
const errorMessage = ref('')
const startedAt = ref(0)
const finishedAt = ref(0)

// 回答結果を保存する場所
// 構造: { [問題ID]: { isCorrect: boolean, userAnswer: any } }
const results = ref({})

// 並び替え問題で「今選んでいる途中」のデータを保存する場所
const currentSortBuffer = ref({}) 

// ■ データ取得
const fetchQuestions = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    const response = await fetch(`http://localhost:3000/api/questions?category=${encodeURIComponent(props.category)}`, { signal: controller.signal })
    clearTimeout(timeoutId)
    if (!response.ok) throw new Error('取得失敗')
    questions.value = await response.json()
    initialTotalCount.value = questions.value.length
    // 新しいデータ取得時にインデックスと状態を初期化
    currentIndex.value = 0
    results.value = {}
    currentSortBuffer.value = {}
    isReviewMode.value = false
    hasFiredConfetti.value = false
    startedAt.value = Date.now()
    finishedAt.value = 0
  } catch (err) {
    console.error(err)
    if (err?.name === 'AbortError') {
      errorMessage.value = '通信がタイムアウトしました。ネットワークやサーバーを確認してください。'
    } else {
      errorMessage.value = '問題の取得に失敗しました。時間をおいて再度お試しください。'
    }
  } finally {
    loading.value = false
  }
}

// ■ 問題タイプ判定（正解にカンマがあれば並び替えとみなす）
const getQuestionType = (q) => {
  // 文字列にしてカンマが含まれているかチェック
  return String(q.correctAnswer).includes(',') ? 'sort' : 'choice'
}

// ■ 【選択式】の回答チェック
const checkChoiceAnswer = (q, index) => {
  if (results.value[q.id]) return // 回答済みなら無視
  
  const isCorrect = String(index + 1) === String(q.correctAnswer)
  results.value[q.id] = { isCorrect, userAnswer: index }
  // 回答後に自動で次のカードへ（最後のカード以外）
  if (currentQuestion.value && currentQuestion.value.id === q.id) {
    if (currentIndex.value < questions.value.length - 1) {
      setTimeout(() => { goNext() }, 450)
    }
  }
}

// ■ 【並び替え】の選択処理 (単語をクリックした時)
const addToSortAnswer = (q, index) => {
  if (results.value[q.id]) return // 回答済みなら無視

  // まだバッファがなければ作成
  if (!currentSortBuffer.value[q.id]) {
    currentSortBuffer.value[q.id] = []
  }
  
  // すでに選んでいる単語なら何もしない（重複防止）
  if (currentSortBuffer.value[q.id].includes(index)) return

  // バッファに追加
  currentSortBuffer.value[q.id].push(index)
}

// ■ 【並び替え】のリセット処理
const resetSortAnswer = (q) => {
  if (results.value[q.id]) return
  currentSortBuffer.value[q.id] = []
}

// ■ 【並び替え】の回答決定処理
const submitSortAnswer = (q) => {
   //  箱がなければ空配列を入れる
  const buffer = currentSortBuffer.value[q.id] || []
  if (buffer.length === 0) return // 何も選んでなければ無視

  // ユーザーの回答配列 [0, 2, 1] を "1,3,2" のような文字列(1始まり)に変換
  const userString = buffer.map(i => i + 1).join(',')
  
  // 正解と比較 (空白除去して比較)
  const cleanCorrect = String(q.correctAnswer).replace(/\s/g, '')// 空白除去
  const isCorrect = userString === cleanCorrect

  // 結果を保存
  results.value[q.id] = { isCorrect, userAnswer: userString }
  // 提出後に自動で次のカードへ（最後のカード以外）
  if (currentQuestion.value && currentQuestion.value.id === q.id) {
    if (currentIndex.value < questions.value.length - 1) {
      setTimeout(() => { goNext() }, 450)
    }
  }
}

//全問正解したかどうか
const isFinished = computed(() => {
  //問題データがまだないときはfalse
  if(questions.value.length == 0 ) return false
  //「回答済み数」と「問題総数」が同じなら完了
  return Object.keys(results.value).length == questions.value.length
})

//正解数
const correctCount = computed(() =>{
  let count = 0
  //resultsの中を見て、isCorrectがtrueのものを数える
  Object.values(results.value).forEach(res => {
    if (res.isCorrect) count++
  })
  return count
})

// 間違い数
const wrongCount = computed(() => {
  if (questions.value.length === 0) return 0
  return questions.value.length - correctCount.value
})

//スコア（100点満点換算）
const score = computed (() => {
  if(questions.value.length ==0 ) return 0
  return Math.round((correctCount.value / questions.value.length))*100
})

// 経過時間（ms）と表示
const elapsedMs = computed(() => {
  if (!startedAt.value) return 0
  const end = finishedAt.value || Date.now()
  return Math.max(0, end - startedAt.value)
})
const formatElapsed = (ms) => {
  const totalSec = Math.floor(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}

// 進捗（解答済み数 / 全体、％）
const answeredCount = computed(() => Object.keys(results.value).length)
const progressPercent = computed(() => {
  if (questions.value.length === 0) return 0
  return Math.min(100, Math.round((answeredCount.value / questions.value.length) * 100))
})

// --- Card mode state (one question per screen) ---
const currentIndex = ref(0)
const currentQuestion = computed(() => questions.value[currentIndex.value])
// 質問配列が更新されたら、範囲内にインデックスを調整
watch(questions, (qs) => {
  if (qs.length === 0) return
  if (currentIndex.value < 0 || currentIndex.value >= qs.length) {
    currentIndex.value = 0
  }
})
const isCurrentAnswered = computed(() => {
  const q = currentQuestion.value
  if (!q) return false
  return !!results.value[q.id]
})
const canGoNext = computed(() => isCurrentAnswered.value)

const goNext = () => {
  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value += 1
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}
const goPrev = () => {
  if (currentIndex.value > 0) {
    currentIndex.value -= 1
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

// タッチスワイプ操作
const touchStartX = ref(0)
const touchStartY = ref(0)
const touchStartTime = ref(0)
const onTouchStart = (e) => {
  if (!e.touches || e.touches.length === 0) return
  const t = e.touches[0]
  touchStartX.value = t.clientX
  touchStartY.value = t.clientY
  touchStartTime.value = Date.now()
}
const onTouchEnd = (e) => {
  if (!e.changedTouches || e.changedTouches.length === 0) return
  const t = e.changedTouches[0]
  const dx = t.clientX - touchStartX.value
  const dy = t.clientY - touchStartY.value
  const dt = Date.now() - touchStartTime.value
  const horiz = Math.abs(dx) > 40
  const vertOk = Math.abs(dy) < 40
  const timeOk = dt < 800
  if (!isFinished.value && horiz && vertOk && timeOk) {
    if (dx < 0) {
      // 左スワイプ → 次へ
      if (currentIndex.value < questions.value.length - 1) goNext()
    } else {
      // 右スワイプ → 戻る
      if (currentIndex.value > 0) goPrev()
    }
  }
}

// レビューモード（間違えた問題だけ）
const isReviewMode = ref(false)
const originalQuestions = ref([])
const startReviewWrongOnly = () => {
  const wrong = questions.value.filter(q => results.value[q.id] && !results.value[q.id].isCorrect)
  if (wrong.length === 0) return
  originalQuestions.value = questions.value
  questions.value = wrong
  results.value = {}
  currentSortBuffer.value = {}
  isReviewMode.value = true
  currentIndex.value = 0
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 同じ問題を最初からやり直す
const restartQuiz = () => {
  results.value = {}
  currentSortBuffer.value = {}
  currentIndex.value = 0
  isReviewMode.value = false
  hasFiredConfetti.value = false
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
// パーフェクト時の紙吹雪（一度だけ発火）
const hasFiredConfetti = ref(false)
watch(() => isFinished.value, (done) => {
  if (!done) return
  // Fire confetti ONLY when the full original quiz is perfect (not in review mode)
  if (
    score.value === 100 &&
    !isReviewMode.value &&
    questions.value.length === initialTotalCount.value &&
    !hasFiredConfetti.value &&
    typeof window !== 'undefined' &&
    window.confetti
  ) {
    hasFiredConfetti.value = true
    window.confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.25 }
    })
  }
  // 結果に視線を誘導
  window.scrollTo({ top: 0, behavior: 'smooth' })
  finishedAt.value = Date.now()
})
// 画面が表示されたらすぐに実行
onMounted(() => {
  fetchQuestions()
})
</script>

<template>
 <div class="quiz-container">
    <button @click="$emit('back')" class="back-btn">← メニューに戻る</button>
    <h2 class="cat-title">{{ category }}</h2>

    <!-- Progress -->
    <div v-if="questions.length" class="progress-wrapper">
      <div class="progress-header">
        <span class="progress-label">
          今 {{ Math.min(currentIndex + 1, questions.length) }} / {{ questions.length }} 問目
        </span>
        <span class="progress-count">
          {{ answeredCount }} / {{ questions.length }} 解答済み
        </span>
      </div>
      <div
        class="progress-bar"
        role="progressbar"
        :aria-valuemin="0"
        :aria-valuemax="100"
        :aria-valuenow="progressPercent"
        aria-label="解答進捗"
      >
        <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
      </div>
    </div>

    <div v-if="loading" class="skeleton-wrap">
      <div class="skeleton-card"></div>
      <div class="skeleton-card"></div>
    </div>
    <div v-else-if="errorMessage" class="error-box">
      <p class="error-text">{{ errorMessage }}</p>
      <button class="retry-btn" @click="fetchQuestions">再読み込み</button>
    </div>
    <div v-else-if="isFinished" class="score-card">
      <h3>結果発表</h3>
      <p class="score-detail">
        {{ questions.length }}問中{{ correctCount }}問正解！
      </p>
      <p class="score-detail">所要時間: {{ formatElapsed(elapsedMs) }}</p>

      <div class="finish-actions">
        <button v-if="!isReviewMode && wrongCount > 0" @click="startReviewWrongOnly" class="review-btn">間違えた問題だけ復習する</button>
        <button @click="restartQuiz" class="review-btn">もう一度同じ問題をする</button>
        <button @click="$emit('back')" class="finish-btn">
          {{ isReviewMode ? 'レビューを終了してメニューへ' : '他の問題に挑戦する' }}
        </button>
      </div>
    </div>

    <div v-else-if="!isFinished && questions.length > 0 && currentQuestion">
      <div :key="currentQuestion.id" class="q-box" @touchstart.passive="onTouchStart" @touchend.passive="onTouchEnd">
        <h3 class="q-text"><span class="q-badge">Q.{{ currentQuestion.id }}</span> {{ currentQuestion.text }}</h3>

        <div v-if="getQuestionType(currentQuestion) === 'choice'" class="choices-list">
          <button 
            v-for="(c, i) in currentQuestion.choices" 
            :key="i"
            @click="checkChoiceAnswer(currentQuestion, i)"
            class="choice-btn"
            :class="{
              'correct': results[currentQuestion.id] && i + 1 == currentQuestion.correctAnswer,
              'wrong': results[currentQuestion.id] && results[currentQuestion.id].userAnswer === i && !results[currentQuestion.id].isCorrect,
              'disabled': results[currentQuestion.id]
            }"
          >
            {{ c }}
          </button>
        </div>

        <div v-else class="sort-area">
          <p class="instruction">順番通りにタップしてください</p>
          
          <div class="sort-display">
            <span v-if="!currentSortBuffer[currentQuestion.id] || currentSortBuffer[currentQuestion.id].length === 0" class="placeholder">
              ここに単語が入ります
            </span>
            <span 
              v-for="(idx, order) in (currentSortBuffer[currentQuestion.id] || [])" 
              :key="order" 
              class="sort-item"
            >
              {{ currentQuestion.choices[idx] }}
            </span>
          </div>

          <div class="sort-choices">
            <button 
              v-for="(c, i) in currentQuestion.choices" 
              :key="i"
              @click="addToSortAnswer(currentQuestion, i)"
              class="sort-btn"
              :class="{ 'selected': currentSortBuffer[currentQuestion.id]?.includes(i) }"
              :disabled="results[currentQuestion.id] || currentSortBuffer[currentQuestion.id]?.includes(i)"
            >
              {{ c }}
            </button>
          </div>

          <div v-if="!results[currentQuestion.id]" class="sort-actions">
            <button @click="resetSortAnswer(currentQuestion)" class="reset-btn">リセット</button>
            <button @click="submitSortAnswer(currentQuestion)" class="submit-btn">回答する</button>
          </div>
        </div>

        <div v-if="results[currentQuestion.id]" class="result-box" :class="results[currentQuestion.id].isCorrect ? 'res-ok' : 'res-ng'">
          <div class="res-header">
            {{ results[currentQuestion.id].isCorrect ? '✅ 正解！' : '❌ 不正解...' }}
          </div>
          <div class="res-exp">
            <strong>解説:</strong> {{ currentQuestion.explanation }}
          </div>
        </div>
      </div>

      <!-- ナビゲーションは自動遷移のため非表示 -->
    </div>
    <p v-else>データがありません。</p>
  </div>
</template>

<style scoped>
.quiz-container { padding: 20px; max-width: 800px; margin: 0 auto; }
.back-btn { background: #eceff1; color: var(--text); border: 1px solid var(--border); padding: 8px 16px; border-radius: 8px; cursor: pointer; margin-bottom: 20px;}
.cat-title { text-align: center; margin-bottom: 30px; color: var(--text); }

/* Progress */
.progress-wrapper { margin-bottom: 20px; position: sticky; top: 0; z-index: 10; background: var(--bg); padding: 8px 0 12px; border-bottom: 1px solid var(--border); }
.progress-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; }
.progress-label { font-weight: 600; font-size: 0.95rem; }
.progress-count { font-size: 0.85rem; color: var(--muted-text); }
.progress-bar { position: relative; height: 10px; background: var(--progress-track); border-radius: 999px; overflow: hidden; }
.progress-fill { position: absolute; left: 0; top: 0; bottom: 0; width: 0; background: var(--brand); border-radius: 999px; transition: width 240ms ease; }

.q-box { border: 1px solid var(--border); padding: 20px; border-radius: 12px; margin-bottom: 40px; background: var(--surface); box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.q-text { border-bottom: 2px solid #f0f0f0; padding-bottom: 15px; margin-bottom: 20px; }
.q-badge { background: var(--brand); color: #fff; font-size: 0.8em; padding: 2px 6px; border-radius: 4px; margin-right: 5px; }

/* 選択式のスタイル */
.choices-list { display: flex; flex-direction: column; gap: 12px; }
.choice-btn {
  display: block;
  width: 100%;
  padding: 14px 16px;
  min-height: 48px; /* mobile thumb target */
  border: 2px solid var(--border);
  background: var(--surface);
  border-radius: 10px;
  cursor: pointer;
  text-align: left;
  font-size: 1.05rem;
  line-height: 1.3;
  transition: background 0.2s, border-color 0.2s, transform 0.06s;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
.choice-btn:active:not(.disabled) { transform: translateY(1px); }
.choice-btn:hover:not(.disabled) { background: #f9fafb; border-color: var(--brand); }
.choice-btn.correct, .choice-btn.wrong { animation: fadePulse 260ms ease; }

/* 並び替えのスタイル */
.instruction { font-size: 0.9rem; color: #666; margin-bottom: 10px; }
.sort-display { min-height: 50px; background: #f8f9fa; border: 2px dashed #d1d5db; border-radius: 8px; padding: 10px; margin-bottom: 15px; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.placeholder { color: var(--muted-text); font-size: 0.9rem; }
.sort-item { background: #f3f4f6; color: #374151; padding: 6px 12px; border-radius: 20px; font-weight: 600; }

.sort-choices { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; }
.sort-btn {
  padding: 10px 16px;
  min-height: 44px;
  border: 1px solid var(--border);
  background: var(--surface);
  border-radius: 999px;
  cursor: pointer;
  font-size: 1rem;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
.sort-btn.selected { opacity: 0.3; cursor: default; }

.sort-actions { display: flex; gap: 12px; justify-content: flex-end; }
.reset-btn, .submit-btn {
  min-height: 44px;
  padding: 10px 20px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
.reset-btn { background: #9aa0a6; color: white; }
.submit-btn { background: var(--brand); color: white; font-weight: bold; }

/* Mobile adjustments */
@media (max-width: 480px) {
  .quiz-container { padding: 16px; }
  .choices-list { gap: 10px; }
  .choice-btn { font-size: 1.1rem; padding: 16px 18px; }
  .sort-actions { justify-content: stretch; }
  .reset-btn, .submit-btn { flex: 1 1 0; }
}

/* 結果のスタイル */
.result-box { margin-top: 20px; padding: 15px; border-radius: 8px; animation: fadeIn 0.5s; }
.res-ok { background: var(--ok-bg); border-left: 5px solid var(--ok-border); }
.res-ng { background: var(--ng-bg); border-left: 5px solid var(--ng-border); }
.res-header { font-weight: bold; font-size: 1.1rem; margin-bottom: 5px; }

/* 正誤判定の色 */
.correct { background: var(--ok-bg) !important; border-color: var(--ok-border) !important; color: #155724; }
.wrong { background: var(--ng-bg) !important; border-color: var(--ng-border) !important; color: #7f1d1d; }
.disabled { cursor: not-allowed; opacity: 0.8; }

@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadePulse { from { opacity: 0.75; } to { opacity: 1; } }

/* Score actions */
.finish-actions { display: flex; gap: 12px; justify-content: center; margin-top: 12px; flex-wrap: wrap; }
.review-btn { background: #f3f4f6; color: var(--text); border: 1px solid var(--border); padding: 10px 16px; border-radius: 10px; }
.finish-btn { background: var(--brand); color: #fff; border: none; padding: 10px 16px; border-radius: 10px; }

/* Card navigation removed (auto-advance) */

/* Loading skeleton & error */
.skeleton-wrap { display: grid; gap: 16px; }
.skeleton-card {
  height: 140px;
  border-radius: 12px;
  background: linear-gradient(90deg, #f2f4f7 25%, #e9edf2 37%, #f2f4f7 63%);
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
  border: 1px solid var(--border);
}
@keyframes shimmer { 0% { background-position: 100% 0; } 100% { background-position: -100% 0; } }
.error-box { background: #fff1f2; border: 1px solid #fecdd3; color: #7f1d1d; padding: 12px 14px; border-radius: 10px; }
.error-text { margin: 0 0 8px; }
.retry-btn { background: var(--brand); color: #fff; border: none; padding: 8px 12px; border-radius: 8px; }
</style>