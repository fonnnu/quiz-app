<script setup>
import { ref} from 'vue'
import Menu from './components/Menu.vue'
import QuizArea from './components/QuizArea.vue'

// 現在選択されているカテゴリ (nullならメニューを表示)
const currentCategory = ref(null)

// メニューで選ばれたらカテゴリをセット　（これでQuizAreaに切り替わる)
const onSelect = (categoryName) => {
  currentCategory.value = categoryName
}
// クイズ画面で「戻る」が押された時の処理
const onBack = () => {
  currentCategory.value = null
}
</script>

<template>
  <div class="app-wrapper">
    <header class="topbar">
      <div class="topbar-inner">
        <div class="brand">英語学習アプリ</div>
      </div>
    </header>
    <div class="content">
      <h1 class="visually-hidden">英語学習アプリ</h1>
    
      <Menu 
        v-if="!currentCategory" 
        @select="onSelect" 
      />

      <QuizArea 
        v-else 
        :key="currentCategory"
        :category="currentCategory" 
        @back="onBack" 
      />
    </div>
    
  </div>
</template>

<style scoped>
.app-wrapper { font-family: sans-serif; }
.topbar { position: sticky; top: 0; z-index: 20; background: var(--surface); border-bottom: 1px solid var(--border); }
.topbar-inner { max-width: 900px; margin: 0 auto; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; }
.brand { font-weight: 700; color: var(--text); }
.content { max-width: 900px; margin: 0 auto; padding: 16px; }
.visually-hidden { position: absolute; clip: rect(0 0 0 0); clip-path: inset(50%); height: 1px; width: 1px; overflow: hidden; white-space: nowrap; }
</style>


<style scoped>
/* 全体のデザイン */
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  color: #333;
}

.title {
  text-align: center;
  color: white;
  margin-bottom: 40px;
}

.question-box {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  padding: 25px;
  margin-bottom: 30px;
}

.question-text {
  font-size: 1.2rem;
  margin-bottom: 20px;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 15px;
}

.q-id {
  background: #eee;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  vertical-align: middle;
  margin-right: 8px;
}

/* 選択肢ボタンのデザイン */
.choices-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.choice-btn {
  padding: 15px;
  border: 2px solid #e0e0e0;
  background: black;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.choice-btn:hover:not(.disabled) {
  background: #f8f9fa;
  border-color: #bbb;
}

/* 回答後のスタイル */
.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

/* 正解の選択肢 */
.correct-selection {
  background-color: #d4edda !important;
  border-color: #c3e6cb !important;
  color: #155724;
  font-weight: bold;
}

/* 間違った選択肢 */
.wrong-selection {
  background-color: #f8d7da !important;
  border-color: #f5c6cb !important;
  color: #721c24;
}

/* 結果エリアのデザイン */
.result-area {
  margin-top: 20px;
  padding: 15px;
  border-radius: 8px;
  animation: fadeIn 0.5s ease;
}

.result-ok {
  background-color: #e8f5e9;
  border-left: 5px solid #4caf50;
}

.result-ng {
  background-color: #ffebee;
  border-left: 5px solid #f44336;
}

.explanation {
  margin-top: 10px;
  line-height: 1.6;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>