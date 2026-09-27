import {
  EXPENSE_CATEGORIES,
  OTHER_CATEGORY_KEY,
  CATEGORY_NAME_MAX,
} from '../constants'

// 自定义分类在统一列表中的 key 前缀，金额存放在 record.customCosts[id]
const CUSTOM_PREFIX = 'custom:'

// 合并内置与自定义分类，输出统一结构：{ key, label, custom, id? }
export function allExpenseCategories(customCategories = []) {
  return [
    ...EXPENSE_CATEGORIES.map((c) => ({ ...c, custom: false })),
    ...customCategories.map((c) => ({
      key: `${CUSTOM_PREFIX}${c.id}`,
      id: c.id,
      label: c.label,
      custom: true,
    })),
  ]
}

// 读取一条记录在指定分类（统一 key）下的金额
export function recordCostByCategory(record, key) {
  if (key.startsWith(CUSTOM_PREFIX)) {
    return Number(record.customCosts?.[key.slice(CUSTOM_PREFIX.length)]) || 0
  }
  return Number(record[key]) || 0
}

// 一条记录的全部花费（内置字段 + 自定义分类金额）
export function recordTotalCost(record) {
  const builtin = EXPENSE_CATEGORIES.reduce(
    (sum, { key }) => sum + (Number(record[key]) || 0),
    0
  )
  const custom = Object.values(record.customCosts || {}).reduce(
    (sum, v) => sum + (Number(v) || 0),
    0
  )
  return builtin + custom
}

// 校验自定义分类名称，返回错误信息；通过时返回 ''
export function validateCategoryName(name, customCategories = []) {
  const label = String(name || '').trim()
  if (!label) return '请输入分类名称'
  if (label.length > CATEGORY_NAME_MAX) return `分类名称不能超过 ${CATEGORY_NAME_MAX} 个字`
  const duplicated = allExpenseCategories(customCategories).some(
    (c) => c.label === label
  )
  return duplicated ? '该分类名称已存在，请换一个' : ''
}

// 某自定义分类在所有出行记录中的金额合计
export function customCategoryTotal(plans, categoryId) {
  return plans.reduce(
    (sum, p) =>
      sum +
      (p.records || []).reduce(
        (s, r) => s + (Number(r.customCosts?.[categoryId]) || 0),
        0
      ),
    0
  )
}

export { OTHER_CATEGORY_KEY }
