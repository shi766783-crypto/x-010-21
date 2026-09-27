import { defineStore } from 'pinia'
import { EXPENSE_CATEGORIES } from '../constants'
import { planStorage, categoryStorage } from '../services/storage'
import { generateLuggageTemplate, getDestinationType } from '../services/luggage'
import { generateDefaultTodos } from '../services/todo'
import { computeAchievements, TOTAL_ACHIEVEMENTS } from '../services/achievements'
import { computeDashboardStats, computeMemberLeaderboard } from '../services/stats'
import { daysBetween } from '../utils/format'
import { uid } from '../utils/id'

// 根据出行人数与可选姓名生成成员列表
function buildMemberNames(input) {
  const count = Math.max(1, Number(input.memberCount) || 1)
  const provided = (input.memberNames || []).map((s) => String(s).trim()).filter(Boolean)
  return Array.from({ length: count }, (_, i) => provided[i] || `成员${i + 1}`)
}

export const useTravelStore = defineStore('travel', {
  state: () => ({
    plans: [],
    // 用户自定义花费分类 [{ key, label }]，key 形如 custom_xxx
    customCategories: [],
  }),

  getters: {
    // 固定分类 + 自定义分类（自定义追加在后），供汇总与图表统一使用
    expenseCategories: (state) => [...EXPENSE_CATEGORIES, ...state.customCategories],
    achievements(state) {
      return computeAchievements(state.plans, this.expenseCategories)
    },
    totalAchievements: () => TOTAL_ACHIEVEMENTS,
    dashboardStats(state) {
      return computeDashboardStats(state.plans, this.expenseCategories)
    },
    leaderboard: (state) => computeMemberLeaderboard(state.plans),
    planById: (state) => (id) => state.plans.find((p) => p.id === id),
  },

  actions: {
    // ===== 持久化 =====
    load() {
      this.plans = planStorage.read([])
      this.customCategories = categoryStorage.read([])
    },
    persist() {
      planStorage.write(this.plans)
      categoryStorage.write(this.customCategories)
    },

    // ===== 花费分类 =====
    // 新增自定义分类：名称非空且不与现有分类（含内置）重名
    addExpenseCategory(label) {
      const name = String(label || '').trim()
      if (!name) return { ok: false, error: '请输入分类名称' }
      if (this.expenseCategories.some((c) => c.label === name)) {
        return { ok: false, error: `分类「${name}」已存在` }
      }
      this.customCategories.push({ key: `custom_${uid()}`, label: name })
      return { ok: true }
    },

    // 某自定义分类在所有出行记录中的累计金额（用于删除前提示）
    customCategorySpend(key) {
      return this.plans.reduce(
        (sum, p) =>
          sum + (p.records || []).reduce((s, r) => s + (Number(r[key]) || 0), 0),
        0
      )
    },

    // 删除自定义分类：该分类下已有金额并入「其他」，避免金额凭空消失
    removeExpenseCategory(key) {
      this.plans.forEach((p) => {
        ;(p.records || []).forEach((r) => {
          const amount = Number(r[key]) || 0
          if (amount) r.otherCost = (Number(r.otherCost) || 0) + amount
          delete r[key]
        })
      })
      this.customCategories = this.customCategories.filter((c) => c.key !== key)
    },

    // ===== 出行计划 =====
    createPlan(input) {
      const days = daysBetween(input.startDate, input.endDate)
      const destinationType = getDestinationType(input.tripType)
      const memberNames = buildMemberNames(input)
      const members = memberNames.map((name) => ({ id: uid(), name }))
      const luggage = members.map((m) => ({
        memberId: m.id,
        items: generateLuggageTemplate({ tripType: input.tripType, days }),
      }))

      const plan = {
        id: uid(),
        name: input.name,
        destination: input.destination,
        destinationType,
        tripType: input.tripType,
        startDate: input.startDate,
        endDate: input.endDate,
        days,
        memberCount: members.length,
        transport: input.transport,
        accommodation: input.accommodation,
        budget: Number(input.budget) || 0,
        notes: input.notes,
        photo: input.photo || '',
        members,
        luggage,
        todos: generateDefaultTodos(),
        records: [],
        summary: null,
        createdAt: new Date().toISOString(),
      }
      this.plans.unshift(plan)
      return plan.id
    },

    updatePlan(id, input) {
      const plan = this.planById(id)
      if (!plan) return
      const days = daysBetween(input.startDate, input.endDate)
      Object.assign(plan, {
        name: input.name,
        destination: input.destination,
        destinationType: getDestinationType(input.tripType),
        tripType: input.tripType,
        startDate: input.startDate,
        endDate: input.endDate,
        days,
        transport: input.transport,
        accommodation: input.accommodation,
        budget: Number(input.budget) || 0,
        notes: input.notes,
        photo: input.photo || '',
      })
    },

    deletePlan(id) {
      this.plans = this.plans.filter((p) => p.id !== id)
    },

    // ===== 行李清单 =====
    _findLuggageList(plan, memberId) {
      let list = plan.luggage.find((l) => l.memberId === memberId)
      if (!list) {
        list = { memberId, items: [] }
        plan.luggage.push(list)
      }
      return list
    },

    togglePack(planId, memberId, itemId) {
      const plan = this.planById(planId)
      if (!plan) return
      const list = plan.luggage.find((l) => l.memberId === memberId)
      const target = list?.items.find((i) => i.id === itemId)
      if (target) target.packed = !target.packed
    },

    addCustomItem(planId, memberId, name, category) {
      const plan = this.planById(planId)
      if (!plan) return
      const list = this._findLuggageList(plan, memberId)
      list.items.push({ id: uid(), name, category, custom: true, packed: false })
    },

    removeItem(planId, memberId, itemId) {
      const plan = this.planById(planId)
      if (!plan) return
      const list = plan.luggage.find((l) => l.memberId === memberId)
      if (!list) return
      list.items = list.items.filter((i) => i.id !== itemId)
    },

    // ===== 待办清单 =====
    toggleTodo(planId, todoId) {
      const plan = this.planById(planId)
      const todo = plan?.todos.find((t) => t.id === todoId)
      if (todo) todo.done = !todo.done
    },

    addTodo(planId, name) {
      const plan = this.planById(planId)
      if (plan) plan.todos.push({ id: uid(), name, done: false })
    },

    removeTodo(planId, todoId) {
      const plan = this.planById(planId)
      if (plan) plan.todos = plan.todos.filter((t) => t.id !== todoId)
    },

    // ===== 行程与花费 =====
    addRecord(planId, record) {
      const plan = this.planById(planId)
      if (plan) plan.records.push({ id: uid(), ...record })
    },

    updateRecord(planId, recordId, record) {
      const plan = this.planById(planId)
      const target = plan?.records.find((r) => r.id === recordId)
      if (target) Object.assign(target, record)
    },

    deleteRecord(planId, recordId) {
      const plan = this.planById(planId)
      if (plan) plan.records = plan.records.filter((r) => r.id !== recordId)
    },

    // ===== 出行总结 =====
    saveSummary(planId, summary) {
      const plan = this.planById(planId)
      if (plan) plan.summary = summary
    },
  },
})
