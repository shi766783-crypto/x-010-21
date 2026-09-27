<script setup>
import { ref } from 'vue'
import { useTravelStore } from '../../stores/travel'
import {
  EXPENSE_CATEGORIES,
  OTHER_CATEGORY_LABEL,
  CATEGORY_NAME_MAX,
} from '../../constants'
import { formatMoney } from '../../utils/format'
import Modal from '../common/Modal.vue'

const store = useTravelStore()

const showModal = ref(false)
const newName = ref('')
const errorMsg = ref('')

function open() {
  newName.value = ''
  errorMsg.value = ''
  showModal.value = true
}

function addCategory() {
  const result = store.addCustomCategory(newName.value)
  if (!result.ok) {
    errorMsg.value = result.message
    return
  }
  newName.value = ''
  errorMsg.value = ''
}

// 删除前必须提示：该分类已有金额会并入「其他」，避免金额凭空消失
function removeCategory(category) {
  const spend = store.customCategorySpend(category.id)
  const message = spend > 0
    ? `分类「${category.label}」下已有 ${formatMoney(spend)} 的花费，删除后该金额将并入「${OTHER_CATEGORY_LABEL}」分类，确认删除吗？`
    : `确认删除自定义分类「${category.label}」吗？该分类暂无花费记录。`
  if (confirm(message)) {
    store.removeCustomCategory(category.id)
  }
}
</script>

<template>
  <span>
    <button type="button" class="btn btn-ghost btn-sm" @click="open">管理分类</button>

    <Modal :show="showModal" title="管理花费分类" @close="showModal = false">
      <!-- 内置分类 -->
      <p class="form-label">内置分类（不可删除）</p>
      <div class="cat-list">
        <span v-for="c in EXPENSE_CATEGORIES" :key="c.key" class="tag tag-gray">
          {{ c.label }}
        </span>
      </div>

      <!-- 自定义分类 -->
      <p class="form-label cat-section">我的分类</p>
      <div v-if="store.customCategories.length" class="cat-list cat-custom">
        <div v-for="c in store.customCategories" :key="c.id" class="cat-item">
          <span class="tag tag-blue">{{ c.label }}</span>
          <button
            type="button"
            class="cat-remove"
            @click="removeCategory(c)"
          >删除</button>
        </div>
      </div>
      <p v-else class="cat-empty">还没有自定义分类，可在下方添加，例如「住宿」「油费」</p>

      <!-- 新增分类 -->
      <div class="cat-add">
        <input
          v-model="newName"
          class="input"
          :maxlength="CATEGORY_NAME_MAX"
          placeholder="输入新分类名称"
          @keyup.enter="addCategory"
        />
        <button type="button" class="btn btn-primary" @click="addCategory">添加</button>
      </div>
      <p v-if="errorMsg" class="cat-error">{{ errorMsg }}</p>
      <p class="cat-tip">
        删除自定义分类后，其下已记录的金额会自动并入「{{ OTHER_CATEGORY_LABEL }}」分类
      </p>

      <template #footer>
        <button type="button" class="btn btn-primary" @click="showModal = false">完成</button>
      </template>
    </Modal>
  </span>
</template>

<style scoped>
.cat-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.cat-section {
  margin-top: 18px;
}

.cat-custom {
  flex-direction: column;
  align-items: stretch;
  gap: 6px;
}

.cat-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  background: var(--bg);
  border-radius: var(--radius-sm);
}

.cat-remove {
  border: none;
  background: transparent;
  color: var(--danger);
  font-size: 12px;
  padding: 2px 4px;
}

.cat-remove:hover {
  text-decoration: underline;
}

.cat-empty {
  font-size: 13px;
  color: var(--text-muted);
}

.cat-add {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}

.cat-add .input {
  flex: 1;
}

.cat-error {
  margin-top: 8px;
  font-size: 12px;
  color: var(--danger);
}

.cat-tip {
  margin-top: 10px;
  font-size: 12px;
  color: var(--text-muted);
}
</style>
