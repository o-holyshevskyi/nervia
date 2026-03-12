/* eslint-disable @typescript-eslint/no-explicit-any */
import { SupabaseClient } from "@supabase/supabase-js";
import { useUser } from "./useUser";
import { useCallback, useEffect, useState } from "react";

export const useLinks = (supabase: SupabaseClient<any, "public", "public", any, any>) => {
    const { user, isLoading: isUserLoading } = useUser(supabase);

    const [links, setLinks] = useState<any[] | undefined>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const fetchLinks = useCallback(async (): Promise<void> => {
        if (!user) return;

        try {
            setIsLoading(true);
            const { data, error } = await supabase.from('links').select('*');

            if (error) throw error;

            setLinks(data);
        } catch (error) {
            console.error("Error fetch links:", error);
        } finally {
            setIsLoading(false);
        }
    }, [supabase, user]);

    useEffect(() => {
        fetchLinks();
    }, [fetchLinks]);

    return {
        links,
        isLinksLoading: isUserLoading || isLoading,
    }
}