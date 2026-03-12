import { SupabaseClient, User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useUser = (supabase: SupabaseClient<any, "public", "public", any, any>) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    
    useEffect(() => {
        const initSession = async () => {
            try {
                setIsLoading(true);
                const { data: { user: authUser } } = await supabase.auth.getUser();
                setUser(authUser);
            } catch (error) {
                console.error("Error initializing session/data:", error);
            } finally {
                setIsLoading(false);
            }
        }

        initSession();
    }, [supabase]);

    return {
        user,
        isLoading,
    }
}