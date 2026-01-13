<script setup>
import { ref, computed, onMounted } from 'vue'

// 親(App.vue)に「これを選んだよ！」と伝えるための設定
const emit = defineEmits(['select'])

const rawData = ref([])
const loading = ref(true)
const errorMessage = ref('')
const searchQuery = ref('')
const openCategoryId = ref(null)

// ■ APIからテスト一覧を取得（タイムアウト付き）
const fetchMenuList = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    // 1. 環境変数からURLを取得（VITE_が付いているので Vite が自動認識します）
    const API_URL = import.meta.env.VITE_API_URL;
    // 2. `${API_URL}` を使って fetch する
    const response = await fetch(`${API_URL}/categories`, { signal: controller.signal })
    
    clearTimeout(timeoutId)
    if (!response.ok) throw new Error('取得失敗')
    rawData.value = await response.json()
  } catch (error) {
    console.error('メニューの取得に失敗:', error)
    errorMessage.value = error?.name === 'AbortError' ? '通信がタイムアウトしました。' : 'メニューの取得に失敗しました。'
  } finally {
    loading.value = false
  }
}

// ■ 検索 & グループ化
const groupedData = computed(() => {
  const q = searchQuery.value.trim()
  const filtered = q
    ? rawData.value.filter(item =>
        item.displayName.includes(q) || item.categoryName.includes(q)
      )
    : rawData.value
  const groups = {}
  filtered.forEach(item => {
    if (!groups[item.categoryId]) {
      groups[item.categoryId] = { id: item.categoryId, name: item.categoryName, items: [] }
    }
    groups[item.categoryId].items.push(item)
  })
  return Object.values(groups)
})

const toggleAccordion = (id) => {
  openCategoryId.value = openCategoryId.value === id ? null : id
}

onMounted(fetchMenuList)
</script>

<template>
  <div class="menu-wrap">
    <h2 class="menu-title">クイズを選ぶ</h2>

    <div class="search-wrap">
      <div class="search-field">
        <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path fill-rule="evenodd" d="M10 3.5a6.5 6.5 0 104.154 11.459l4.444 4.444a.75.75 0 101.06-1.06l-4.444-4.444A6.5 6.5 0 0010 3.5zM5 10a5 5 0 1110 0A5 5 0 015 10z" clip-rule="evenodd"/>
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="テスト名やカテゴリで検索..."
          class="search-input"
        />
      </div>
    </div>

    <div v-if="loading" class="skeleton-list">
      <div class="skeleton-card"></div>
      <div class="skeleton-card"></div>
      <div class="skeleton-card"></div>
    </div>
    <div v-else-if="errorMessage" class="error-box">
      <p class="error-text">{{ errorMessage }}</p>
      <button class="retry-btn" @click="fetchMenuList">再読み込み</button>
    </div>
    <div v-else class="group-list">
      <div v-for="group in groupedData" :key="group.id" class="group-card">
        <button @click="toggleAccordion(group.id)" class="group-header" :aria-expanded="openCategoryId === group.id">
          <div class="group-header-left">
            <span class="group-name">{{ group.name }}</span>
            <span class="group-badge">{{ group.items.length }}</span>
          </div>
          <svg :class="['chevron', { 'is-open': openCategoryId === group.id }]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>

        <div v-show="openCategoryId === group.id" class="group-body">
          <div 
            v-for="item in group.items" :key="item.sheetName"
            class="item-row"
            @click="$emit('select', item.sheetName)"
          >
            <span class="item-name">{{ item.displayName }}</span>
            <span class="item-cta">開始 ＞</span>
          </div>
          <div v-if="group.items.length === 0" class="empty-row">このカテゴリにはテストがありません</div>
        </div>
      </div>

      <div v-if="groupedData.length === 0" class="empty-state">
        該当するテストが見つかりません
      </div>
    </div>
  </div>
</template>

<style scoped>
.menu-wrap { max-width: 900px; margin: 0 auto; padding: 16px; }
.menu-title { text-align: center; font-weight: 700; margin-bottom: 16px; color: var(--text); }

.search-wrap { margin-bottom: 12px; }
.search-field { position: relative; }
.search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: #9aa0a6; }
.search-input {
  width: 100%;
  height: 40px;
  padding: 0 12px 0 36px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  color: var(--text);
}
.search-input:focus { outline: 3px solid rgba(66,184,131,.25); border-color: var(--brand); }

.group-list { display: grid; gap: 12px; }
.group-card { border: 1px solid var(--border); border-radius: 12px; background: var(--surface); overflow: hidden; }
.group-header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  background: #f8fafc;
  border: none;
  cursor: pointer;
}
.group-header:hover { background: #f3f4f6; }
.group-header-left { display: flex; align-items: center; gap: 8px; }
.group-name { font-weight: 700; color: var(--text); }
.group-badge { background: var(--brand); color: #fff; font-size: 12px; padding: 2px 8px; border-radius: 999px; }
.chevron { width: 18px; height: 18px; color: #9aa0a6; transition: transform .2s ease; }
.chevron.is-open { transform: rotate(180deg); }

.group-body { border-top: 1px solid var(--border); }
.item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
}
.item-row:last-child { border-bottom: none; }
.item-row:hover { background: #f8fafc; }
.item-name { color: var(--text); }
.item-cta { color: var(--brand); font-weight: 700; }
.empty-row { padding: 14px; color: #6b7280; }

.empty-state { text-align: center; color: #6b7280; padding: 24px 0; }

/* Loading skeleton */
.skeleton-list { display: grid; gap: 12px; }
.skeleton-card {
  height: 64px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: linear-gradient(90deg, #f2f4f7 25%, #e9edf2 37%, #f2f4f7 63%);
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
}
@keyframes shimmer { 0%{ background-position:100% 0 } 100%{ background-position:-100% 0 } }

/* Error */
.error-box { background: #fff1f2; border: 1px solid #fecdd3; color: #7f1d1d; padding: 12px 14px; border-radius: 10px; }
.error-text { margin: 0 0 8px; }
.retry-btn { background: var(--brand); color: #fff; border: none; padding: 8px 12px; border-radius: 8px; }
</style>