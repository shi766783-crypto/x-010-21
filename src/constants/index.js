// 出行类型
export const TRIP_TYPES = ['短途', '长途', '出国', '周边游', '探亲', '出差']

// 交通方式
export const TRANSPORTS = ['自驾', '高铁', '飞机', '大巴', '其他']

// 行李清单分类
export const LUGGAGE_CATEGORIES = ['证件类', '衣物类', '洗漱类', '电子设备类', '药品类', '其他类']

// 默认待办清单
export const TODO_DEFAULTS = ['订票', '订酒店', '换外币', '检查证件有效期', '购买旅行保险']

// 内置花费分类（固定不可删除，用于汇总与图表）
// 用户自定义分类见 store.customCategories，金额存放在记录的 customCosts 字段
export const EXPENSE_CATEGORIES = [
  { key: 'transportCost', label: '交通' },
  { key: 'mealCost', label: '餐饮' },
  { key: 'ticketCost', label: '门票' },
  { key: 'shoppingCost', label: '购物' },
  { key: 'otherCost', label: '其他' },
]

// 删除自定义分类时，其下金额并入「其他」分类
export const OTHER_CATEGORY_KEY = 'otherCost'
export const OTHER_CATEGORY_LABEL = '其他'

// 自定义分类名称长度限制
export const CATEGORY_NAME_MAX = 10

// 目的地类型（国内 / 国外）
export const DESTINATION_TYPES = {
  DOMESTIC: '国内',
  ABROAD: '国外',
}
