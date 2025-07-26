import { fetcher } from "./fetcher"

type AddStashResult = {
  success: boolean
  data?: any
  error?: any
}

export const addStash = async (
  url: string,
  access_token: string
): Promise<AddStashResult> => {
  try {
    const { success, data, error } = await fetcher("addSave", { url }, { accessToken: access_token })

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