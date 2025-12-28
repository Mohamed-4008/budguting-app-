/**
 * Budget Calculations Service
 * Helper functions for budget-related calculations
 */

// Average number of weeks in a month
const WEEKS_PER_MONTH = 4.33;

/**
 * Convert a weekly spending target to a monthly target
 * @param {number} weeklyTarget - The weekly spending target
 * @returns {number} The equivalent monthly target
 */
const weeklyToMonthlyTarget = (weeklyTarget) => {
  return weeklyTarget * WEEKS_PER_MONTH;
};

/**
 * Convert a monthly spending target to a weekly target
 * @param {number} monthlyTarget - The monthly spending target
 * @returns {number} The equivalent weekly target
 */
const monthlyToWeeklyTarget = (monthlyTarget) => {
  return monthlyTarget / WEEKS_PER_MONTH;
};

/**
 * Determine if a category is weekly based on its date format
 * @param {string} date - The date string of the category
 * @returns {boolean} True if the category is weekly, false otherwise
 */
const isWeeklyCategory = (date) => {
  return date && date.startsWith('Weekly on ');
};

/**
 * Get the day of week from a weekly category date string
 * @param {string} date - The date string of the category (e.g., "Weekly on Mon")
 * @returns {string|null} The day of week or null if not a weekly category
 */
const getWeeklyDay = (date) => {
  if (isWeeklyCategory(date)) {
    return date.replace('Weekly on ', '');
  }
  return null;
};

module.exports = {
  WEEKS_PER_MONTH,
  weeklyToMonthlyTarget,
  monthlyToWeeklyTarget,
  isWeeklyCategory,
  getWeeklyDay
};