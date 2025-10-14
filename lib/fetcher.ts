import { supabase } from '~/constants/supabase';

type FetcherOptions = {
  userId?: string;
  skipAuth?: boolean; // For endpoints that don't need authentication
};

export const fetcher = async (
  functionName: string,
  params: Record<string, any> = {},
  options: FetcherOptions = {}
): Promise<any> => {
  const API_KEY = process.env.EXPO_PUBLIC_API_KEY ?? "";
  const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";
  // const API_URL = "https://dbe2f37263ca.ngrok-free.app/api/v1";

  console.log(API_URL)


  console.log("~🚀~: Calling function: ", functionName)
  
  const finalParams = {
    ...params,
    ...options
  }

  // Add userId to params if provided
  if (options.userId) {
    finalParams.userId = options.userId;
  }

  try {
    const body: Record<string, any> = {
      apiKey: API_KEY,
      function: functionName,
      params: finalParams
    };

    // Attach userId if provided
    if (options.userId) body.params.userId = options.userId;

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log(data)
    return data;
  } catch (error: any) {
    console.log(error)
    return {
      success: false,
      data: null,
      error: error.message || "Something went wrong",
    };
  }
};