import {
  allExpenseCategories,
  recordCostByCategory,
  recordTotalCost,
} from './expenseCategories'
import { luggageCompletionRate } from './luggage'

// 单次出行总花费
// 自定义分类的金额始终计入（即使分类配置丢失，总额也不会凭空变化）
export function planTotalSpend(plan) {
  return (plan.records || []).reduce((sum, r) => sum + recordTotalCost(r), 0)
}

// 单次出行花费分类汇总（内置分类 + 当前自定义分类）
export function planSpendBreakdown(plan, customCategories = []) {
  const records = plan.records || []
  return allExpenseCategories(customCategories).reduce((acc, { key, label }) => {
    acc[label] = records.reduce((sum, r) => sum + recordCostByCategory(r, key), 0)
    return acc
  }, {})
}

// 单次出行行李打包完成率（各成员平均）
export function planPackingRate(plan) {
  const lists = plan.luggage || []
  if (!lists.length) return 0
  const sum = lists.reduce((s, l) => s + luggageCompletionRate(l.items), 0)
  return Math.round(sum / lists.length)
}

// 单次出行待办完成进度（0-100）
export function planTodoProgress(plan) {
  const todos = plan.todos || []
  if (!todos.length) return 0
  return Math.round((todos.filter((t) => t.done).length / todos.length) * 100)
}

// 判断待办是否全部完成
export function planTodosAllDone(plan) {
  const todos = plan.todos || []
  return todos.length > 0 && todos.every((t) => t.done)
}
