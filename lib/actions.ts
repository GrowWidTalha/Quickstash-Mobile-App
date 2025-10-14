import { fetcher } from "./fetcher"

type AddStashResult = {
  success: boolean
  data?: any
  error?: any
}

export const addStash = async (
  url: string,
  userId: string
): Promise<AddStashResult> => {
  try {
    const { success, data, error } = await fetcher("addSave", { url }, { userId })

    if (success) {
      return { success: true, data }
    } else {
        console.log(error)
      return { success: false, error }
    }
  } catch (error) {
    console.log(error)
    return { success: false, error }
  }
}