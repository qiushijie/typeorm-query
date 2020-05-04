/**
 * 首字母大写
 * @param str
 */
export function firstToUpperCase(str: string) {
  if (str == null || str.length == 0) {
    return str;
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}