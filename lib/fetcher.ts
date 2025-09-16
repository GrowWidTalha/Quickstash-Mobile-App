import { supabase } from '~/constants/supabase';

type FetcherOptions = {
  token?: string;
  accessToken?: string;
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


  // Get access token automatically unless skipAuth is true
  console.log("~🚀~: Calling function: ", functionName)
  let accessToken: string | null = null;
  if (!options.skipAuth) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      accessToken = session?.access_token || null;
    } catch (error) {
      console.error('Failed to get access token:', error);
    }
  }

  const finalParams = {
    ...params,
    ...options
  }

  // Add access token to params if available
  if (accessToken) {
    finalParams.accessToken = accessToken;
  }

  try {
    const body: Record<string, any> = {
      apiKey: API_KEY,
      function: functionName,
      params: finalParams
    };

    // Attach token if provided (for backward compatibility)
    if (options.token) body.params.token = options.token;
    if (options.accessToken) body.params.accessToken = options.accessToken;

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