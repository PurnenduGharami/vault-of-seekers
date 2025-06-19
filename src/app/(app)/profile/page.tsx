
"use client";

import type { NextPage } from 'next';
import { useState, useEffect, type ChangeEvent, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  User, Sun, Moon, Laptop, Palette, LogOut, KeyRound, Save, ExternalLink, Loader2,
  ArrowUp, ArrowDown, RefreshCcw, AlertTriangle, ListChecks, Archive, Edit3, XCircle, DownloadCloud,
  Copy, Trash2
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import type { HistoryItem } from '@/app/(app)/history/page';
import type { Project } from '@/app/(app)/home/page';

const initialDefaultUserName = "Arcane Seeker";
const initialDefaultUserBio = "A curious seeker exploring the depths of arcane knowledge and ancient mysteries. My journey is one of perpetual discovery within the Vault.";

export interface ApiKeyEntry {
  configId: string; 
  providerId: string; 
  name: string; 
  apiKey: string;
  docsLink?: string;
  rank?: number;
  dailyQuota?: number;
  usageToday?: number;
  lastResetDate?: string;
  isDeletable: boolean;
  defaultModel?: string;
}

const PREDEFINED_API_PROVIDER_BASES: { providerId: string; name: string; docsLink?: string, defaultModel?: string }[] = [
  { providerId: 'gemini', name: 'Google Gemini', docsLink: 'https://ai.google.dev/docs' },
  { providerId: 'deepseek', name: 'DeepSeek', docsLink: 'https://platform.deepseek.com/api-docs/', defaultModel: 'deepseek-chat' },
  { providerId: 'huggingface', name: 'Hugging Face', docsLink: 'https://huggingface.co/docs/api-inference/quicktour', defaultModel: 'mistralai/Mixtral-8x7B-Instruct-v0.1' },
  { providerId: 'replicate', name: 'Replicate', docsLink: 'https://replicate.com/docs/reference/http', defaultModel: 'mistralai/mistral-7b-instruct-v0.1:83b6a56e7c828e667f21fd596c338fd4f0039b46bcfa18d973e8e70e455fda70' },
  { providerId: 'openai', name: 'OpenAI', docsLink: 'https://platform.openai.com/docs/api-reference/chat', defaultModel: 'gpt-3.5-turbo' },
  { providerId: 'anthropic', name: 'Anthropic (Claude)', docsLink: 'https://docs.anthropic.com/claude/reference/messages_post', defaultModel: 'claude-3-haiku-20240307' },
  { providerId: 'mistralai', name: 'Mistral AI', docsLink: 'https://docs.mistral.ai/api-reference/#operation/createChatCompletion', defaultModel: 'mistral-tiny' },
];


const ProfilePage: NextPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const userEmail = "seeker@vault.com";

  const [userName, setUserName] = useState('');
  const [isUserNameInitialized, setIsUserNameInitialized] = useState(false);
  const [userBio, setUserBio] = useState('');
  const [isBioInitialized, setIsBioInitialized] = useState(false);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempUserName, setTempUserName] = useState('');
  const [tempUserBio, setTempUserBio] = useState('');

  const [selectedTheme, setSelectedTheme] = useState("system");
  const [isThemeInitialized, setIsThemeInitialized] = useState(false);

  const [apiKeys, setApiKeys] = useState<ApiKeyEntry[]>([]);
  const [areApiKeysInitialized, setAreApiKeysInitialized] = useState(false);
  
  const [apiToDelete, setApiToDelete] = useState<ApiKeyEntry | null>(null);

  const [activeApis, setActiveApis] = useState<ApiKeyEntry[]>([]);
  const [dormantApis, setDormantApis] = useState<ApiKeyEntry[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let loadedName: string;
    const storedName = localStorage.getItem('vaultUserName');
    if (storedName) {
      loadedName = storedName;
    } else {
      loadedName = initialDefaultUserName;
      localStorage.setItem('vaultUserName', loadedName);
    }
    setUserName(loadedName);
    setTempUserName(loadedName);
    setIsUserNameInitialized(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let loadedBio: string;
    const storedBio = localStorage.getItem('vaultUserBio');
    if (storedBio) {
      loadedBio = storedBio;
    } else {
      loadedBio = initialDefaultUserBio;
      localStorage.setItem('vaultUserBio', loadedBio);
    }
    setUserBio(loadedBio);
    setTempUserBio(loadedBio);
    setIsBioInitialized(true);
  }, []);

  const handleStartEdit = () => {
    setTempUserName(userName);
    setTempUserBio(userBio);
    setIsEditingProfile(true);
  };

  const handleSaveChanges = () => {
    setUserName(tempUserName);
    setUserBio(tempUserBio);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vaultUserName', tempUserName);
      localStorage.setItem('vaultUserBio', tempUserBio);
    }
    setIsEditingProfile(false);
    setTimeout(() => {
      toast({ title: "Profile Updated", description: "Your name and bio have been saved." });
    }, 0);
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
  };

  const sortAndGroupApis = useCallback((keysToGroup: ApiKeyEntry[]) => {
    const active = keysToGroup
      .filter(k => k.apiKey && k.apiKey.trim() !== '')
      .sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity));
    
    const dormant = keysToGroup
      .filter(k => !k.apiKey || k.apiKey.trim() === '')
      .sort((a, b) => {
        const aIsCopy = a.configId.includes("_copy_");
        const bIsCopy = b.configId.includes("_copy_");
        const aTimestamp = aIsCopy ? parseInt(a.configId.split("_copy_")[1] || "0") : 0;
        const bTimestamp = bIsCopy ? parseInt(b.configId.split("_copy_")[1] || "0") : 0;

        if (aIsCopy && !bIsCopy) return -1; 
        if (!aIsCopy && bIsCopy) return 1;  
        if (aIsCopy && bIsCopy) return bTimestamp - aTimestamp; 
        
        return PREDEFINED_API_PROVIDER_BASES.findIndex(p => p.providerId === a.providerId) - PREDEFINED_API_PROVIDER_BASES.findIndex(p => p.providerId === b.providerId);
      });

    setActiveApis(active);
    setDormantApis(dormant);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let currentTheme: string;
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme && ['dark', 'light', 'system'].includes(storedTheme)) {
        currentTheme = storedTheme;
    } else {
        currentTheme = 'system';
        localStorage.setItem('theme', currentTheme);
    }
    setSelectedTheme(currentTheme);
    setIsThemeInitialized(true);
  }, []);

  useEffect(() => {
      if (typeof window === 'undefined' || !isThemeInitialized) return;
      localStorage.setItem('theme', selectedTheme);
      window.dispatchEvent(new CustomEvent('themeChanged'));
  }, [selectedTheme, isThemeInitialized]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedApiKeysV2 = localStorage.getItem('vaultApiKeysV2');
    let loadedConfigsFromStorage: ApiKeyEntry[] = [];
    if (storedApiKeysV2) {
        try {
            loadedConfigsFromStorage = JSON.parse(storedApiKeysV2);
        } catch (e) {
            console.error("Error parsing vaultApiKeysV2 from localStorage", e);
        }
    }

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    let finalKeyConfigs: ApiKeyEntry[] = [];

    PREDEFINED_API_PROVIDER_BASES.forEach(baseProvider => {
        const originalConfigId = `${baseProvider.providerId}_original`;
        const storedOriginal = loadedConfigsFromStorage.find(s => s.configId === originalConfigId);

        if (storedOriginal) {
            finalKeyConfigs.push({
                ...storedOriginal,
                providerId: baseProvider.providerId, 
                name: baseProvider.name, 
                docsLink: baseProvider.docsLink,
                defaultModel: baseProvider.defaultModel || storedOriginal.defaultModel,
                isDeletable: false, 
                dailyQuota: storedOriginal.dailyQuota === undefined || storedOriginal.dailyQuota === null ? 100 : storedOriginal.dailyQuota,
                usageToday: storedOriginal.usageToday ?? 0,
                lastResetDate: storedOriginal.lastResetDate || todayStr,
            });
        } else {
            finalKeyConfigs.push({
                configId: originalConfigId,
                providerId: baseProvider.providerId,
                name: baseProvider.name,
                apiKey: '',
                docsLink: baseProvider.docsLink,
                defaultModel: baseProvider.defaultModel,
                rank: undefined,
                dailyQuota: 100,
                usageToday: 0,
                lastResetDate: todayStr,
                isDeletable: false,
            });
        }
    });

    loadedConfigsFromStorage.forEach(storedKey => {
        if (storedKey.configId && storedKey.configId.includes("_copy_")) {
            const baseProvider = PREDEFINED_API_PROVIDER_BASES.find(p => p.providerId === storedKey.providerId);
            if (baseProvider && !finalKeyConfigs.find(fc => fc.configId === storedKey.configId)) { 
                finalKeyConfigs.push({
                    ...storedKey,
                    name: storedKey.name || `${baseProvider.name} (Copy)`, 
                    docsLink: baseProvider.docsLink,
                    defaultModel: baseProvider.defaultModel || storedKey.defaultModel,
                    isDeletable: true, 
                    dailyQuota: storedKey.dailyQuota === undefined || storedKey.dailyQuota === null ? 100 : storedKey.dailyQuota,
                    usageToday: storedKey.usageToday ?? 0,
                    lastResetDate: storedKey.lastResetDate || todayStr,
                });
            }
        }
    });
    
    finalKeyConfigs = finalKeyConfigs.map(key => {
        if (key.lastResetDate !== todayStr) {
            return { ...key, usageToday: 0, lastResetDate: todayStr };
        }
        return key;
    });

    setApiKeys(finalKeyConfigs);
    setAreApiKeysInitialized(true);
  }, []);


  useEffect(() => {
    if (!areApiKeysInitialized) return; 
    sortAndGroupApis(apiKeys); 
  }, [apiKeys, areApiKeysInitialized, sortAndGroupApis]);


  const handleApiKeyChange = (configId: string, value: string) => {
    setApiKeys(prevKeys =>
      prevKeys.map(key => (key.configId === configId ? { ...key, apiKey: value } : key))
    );
  };

  const handleQuotaChange = (configId: string, quotaStr: string) => {
    const quota = parseInt(quotaStr, 10);
    setApiKeys(prev => prev.map(k => k.configId === configId ? { ...k, dailyQuota: isNaN(quota) || quota < 0 ? 0 : quota } : k));
  };

  const handleResetUsage = (configId: string) => {
    setApiKeys(prev => prev.map(k => k.configId === configId ? { ...k, usageToday: 0, lastResetDate: format(new Date(), 'yyyy-MM-dd') } : k));
    setTimeout(() => {
        toast({ title: "Usage Reset Pending", description: `Usage for ${apiKeys.find(k => k.configId === configId)?.name} will be reset when changes are saved.`});
    }, 0);
  };

 const handleMoveApi = (configId: string, direction: 'up' | 'down') => {
    setApiKeys(prevApiKeys => {
      let newFullKeysList = [...prevApiKeys];
      let currentActiveApis = newFullKeysList
        .filter(k => k.apiKey && k.apiKey.trim() !== '')
        .sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity));

      const apiIndexInActive = currentActiveApis.findIndex(k => k.configId === configId);
      if (apiIndexInActive === -1) return prevApiKeys;

      let targetIndexInActive = direction === 'up' ? apiIndexInActive - 1 : apiIndexInActive + 1;
      if (targetIndexInActive < 0 || targetIndexInActive >= currentActiveApis.length) {
        return prevApiKeys;
      }

      const itemToMove = currentActiveApis.splice(apiIndexInActive, 1)[0];
      currentActiveApis.splice(targetIndexInActive, 0, itemToMove);

      currentActiveApis.forEach((api, index) => {
        const originalApiInFullList = newFullKeysList.find(k => k.configId === api.configId);
        if (originalApiInFullList) {
          originalApiInFullList.rank = index;
        }
      });
      
      newFullKeysList.filter(k => !k.apiKey || k.apiKey.trim() === '').forEach(k => k.rank = undefined);
      
      setTimeout(() => {
        toast({ title: "API Rank Adjusted", description: `Ranks updated. Click 'Save All API Key Changes' to persist.` });
      }, 0);
      return newFullKeysList; 
    });
  };

  const handleSaveAllApiChanges = () => {
    let processingKeys = apiKeys.map(key => ({ ...key, apiKey: key.apiKey ? key.apiKey.trim() : '' }));

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    processingKeys = processingKeys.map(key => {
        let usageToSet = key.usageToday ?? 0;
        let dateToSet = key.lastResetDate || todayStr;
        
        // If a key was marked for usage reset (by handleResetUsage directly setting usageToday to 0 and date to today),
        // that explicit reset should be honored. Otherwise, if the date is old, reset.
        if (key.lastResetDate === todayStr && key.usageToday === 0) {
            // Already reset by handleResetUsage for today, keep it.
        } else if (dateToSet !== todayStr) {
            usageToSet = 0;
            dateToSet = todayStr;
        }

        if (key.apiKey && key.apiKey.trim() !== '') { 
            return {
            ...key,
            dailyQuota: key.dailyQuota === undefined || key.dailyQuota === null ? 100 : Math.max(0, key.dailyQuota ?? 0),
            usageToday: usageToSet,
            lastResetDate: dateToSet,
            };
        }
        // For dormant keys, also ensure usage is 0 and date is current, though rank will be undefined.
        return { ...key, usageToday: 0, lastResetDate: todayStr, rank: undefined };
    });

    const currentlyActive = processingKeys.filter(k => k.apiKey && k.apiKey.trim() !== '');
    const currentlyDormant = processingKeys.filter(k => !k.apiKey || k.apiKey.trim() === '');

    currentlyActive.sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity));
    currentlyActive.forEach((api, index) => { api.rank = index; });
    
    currentlyDormant.forEach(api => { api.rank = undefined; });

    const finalKeysToSave = [...currentlyActive, ...currentlyDormant];

    setApiKeys(finalKeysToSave); 

    if (typeof window !== 'undefined') {
      localStorage.setItem('vaultApiKeysV2', JSON.stringify(finalKeysToSave));
    }
    setTimeout(() => {
        toast({ title: "Success", description: "API Key configurations have been saved." });
    }, 0);
  };

  const handleDuplicateApi = (configIdToDuplicate: string) => {
    const sourceApi = apiKeys.find(key => key.configId === configIdToDuplicate);
    if (!sourceApi) {
      setTimeout(() => {
        toast({ title: "Error", description: "Source API not found for duplication.", variant: "destructive" });
      }, 0);
      return;
    }
     if (!sourceApi.apiKey || sourceApi.apiKey.trim() === '') {
      setTimeout(() => {
        toast({ title: "Cannot Duplicate", description: "Only active API configurations can be duplicated to create a new (dormant) copy.", variant: "destructive" });
      }, 0);
      return;
    }

    const baseProviderInfo = PREDEFINED_API_PROVIDER_BASES.find(p => p.providerId === sourceApi.providerId);
    const originalName = baseProviderInfo ? baseProviderInfo.name : sourceApi.name.replace(/ \(Copy.*\)$/, '');

    const newDuplicate: ApiKeyEntry = {
      ...sourceApi, 
      configId: `${sourceApi.providerId}_copy_${Date.now()}`,
      name: `${originalName} (Copy)`,
      apiKey: '', // New duplicates are dormant by default
      rank: undefined, 
      usageToday: 0,
      lastResetDate: format(new Date(), 'yyyy-MM-dd'),
      isDeletable: true, 
      // dailyQuota will be inherited, can be changed before saving
    };

    const updatedConfigs = [newDuplicate, ...apiKeys]; 
    
    setApiKeys(updatedConfigs); 
    
    setTimeout(() => {
        toast({ title: "API Duplicated", description: `"${newDuplicate.name}" created as a dormant copy. Add an API key and save changes to activate.`});
    }, 0);
  };

  const handleDeleteApiInitiate = (configIdToDelete: string) => {
    const apiEntry = apiKeys.find(key => key.configId === configIdToDelete);
    if (!apiEntry) {
      setTimeout(() => {
        toast({ title: "Error", description: "API not found for deletion.", variant: "destructive"});
      }, 0);
      return;
    }
    if (!apiEntry.isDeletable) {
      setTimeout(() => {
        toast({ title: "Action Not Allowed", description: "Original API configurations cannot be deleted.", variant: "destructive"});
      }, 0);
      return;
    }
    setApiToDelete(apiEntry);
  };

  const handleDeleteApiConfirm = () => {
    if (!apiToDelete) return;
    
    const updatedConfigs = apiKeys.filter(key => key.configId !== apiToDelete.configId);
    
    setApiKeys(updatedConfigs);

    const deletedName = apiToDelete.name;
    setTimeout(() => {
        toast({ title: "API Configuration Removed", description: `"${deletedName}" has been removed. Save changes to persist this deletion.`});
    }, 0);
    setApiToDelete(null);
  };


  const handleThemeChange = (newTheme: string) => {
    setSelectedTheme(newTheme);
  };

  const handleLogout = () => {
    router.push('/login');
  };
  
  const getApiKeyDisplayData = (configId: string) => {
    // Always get the latest from the apiKeys state for display
    return apiKeys.find(k => k.configId === configId);
  };


  const downloadData = (filename: string, content: string, mimeType: string) => {
    const element = document.createElement("a");
    const file = new Blob([content], { type: mimeType });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(element.href);
    setTimeout(() => {
        toast({ title: "Export Successful", description: `${filename} has been downloaded.`});
    }, 0);
  };

  const handleDownloadAllData = () => {
    if (typeof window === 'undefined') return;

    let profileData = { userName: initialDefaultUserName, userBio: initialDefaultUserBio };
    const storedUserName = localStorage.getItem('vaultUserName');
    const storedUserBio = localStorage.getItem('vaultUserBio');
    if (storedUserName) profileData.userName = storedUserName;
    if (storedUserBio) profileData.userBio = storedUserBio;

    let projectsData: Project[] = [];
    const storedProjects = localStorage.getItem('vaultOfSeekersProjects');
    if (storedProjects) {
      try {
        const parsedProjects = JSON.parse(storedProjects) as any[];
        projectsData = parsedProjects.map(p => ({
          id: p.id || `proj_${Math.random().toString(16).slice(2)}`,
          name: p.name || "Unnamed Project",
          isArchived: p.isArchived === undefined ? false : p.isArchived,
        }));
      }
      catch (e) { console.error("Error parsing projects for download", e); }
    }

    let historyData: HistoryItem[] = [];
    const storedHistory = localStorage.getItem('vaultOfSeekersHistory');
    if (storedHistory) {
      try { historyData = JSON.parse(storedHistory); }
      catch (e) { console.error("Error parsing history for download", e); }
    }
    
    // Use the current apiKeys state for export, as it reflects what's on screen
    const apiKeysToExport = apiKeys.map(({ isDeletable, ...rest }) => rest);


    const allData = {
      profile: profileData,
      apiConfigs: apiKeysToExport, // Export current state of API keys
      projects: projectsData,
      history: historyData,
    };

    downloadData('vault_of_seekers_data.json', JSON.stringify(allData, null, 2), 'application/json');
  };


  if (!areApiKeysInitialized || !isThemeInitialized || !isBioInitialized || !isUserNameInitialized) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      <Card className="rounded-2xl shadow-xl border-primary/20">
        <CardHeader>
          <div className="flex items-center">
            <User className="mr-4 h-8 w-8 text-primary" />
            {isEditingProfile ? (
              <Input
                type="text"
                value={tempUserName}
                onChange={(e) => setTempUserName(e.target.value)}
                placeholder="Enter your name"
                className="font-headline text-3xl md:text-4xl p-0 border-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
              />
            ) : (
              <CardTitle className="font-headline text-3xl md:text-4xl">
                {userName}
              </CardTitle>
            )}
          </div>
          <CardDescription className="font-body text-muted-foreground pt-1 pl-12">{userEmail}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="user-bio" className="font-body text-muted-foreground mb-2 block">Seeker's Bio</Label>
            <Textarea
              id="user-bio"
              value={isEditingProfile ? tempUserBio : userBio}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setTempUserBio(e.target.value)}
              placeholder="Describe your seeking philosophies or areas of interest..."
              className="w-full font-body rounded-xl min-h-[100px] bg-background/70"
              rows={4}
              readOnly={!isEditingProfile}
              disabled={!isBioInitialized && !isEditingProfile}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            {isEditingProfile ? (
              <>
                <Button onClick={handleSaveChanges} className="rounded-2xl btn-pulse-hover font-body">
                  <Save className="mr-2 h-5 w-5" /> Save Changes
                </Button>
                <Button variant="outline" onClick={handleCancelEdit} className="rounded-2xl font-body">
                   <XCircle className="mr-2 h-5 w-5" /> Cancel
                </Button>
              </>
            ) : (
              <Button onClick={handleStartEdit} variant="outline" className="rounded-2xl font-body">
                <Edit3 className="mr-2 h-5 w-5" /> Edit Profile
              </Button>
            )}
          </div>
           <div className="pt-4 border-t mt-4 flex flex-col sm:flex-row gap-2">
            <Button onClick={handleLogout} variant="outline" className="w-full sm:w-auto rounded-2xl font-body text-destructive hover:text-destructive-foreground hover:bg-destructive/90 border-destructive/50 hover:border-destructive">
              <LogOut className="mr-2 h-5 w-5" />
              Log Out
            </Button>
            <Button onClick={handleDownloadAllData} variant="outline" className="w-full sm:w-auto rounded-2xl font-body">
              <DownloadCloud className="mr-2 h-5 w-5" />
              Download My Data
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center"><Palette className="mr-3 h-6 w-6 text-accent" />Theme Selector</CardTitle>
          <CardDescription className="font-body">Choose your preferred interface appearance.</CardDescription>
        </CardHeader>
        <CardContent>
          {!isThemeInitialized ? (
            <div className="flex justify-center items-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                <span className="font-body text-muted-foreground">Loading theme settings...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(['light', 'dark', 'system'] as const).map(themeOption => (
                <Button
                  key={themeOption}
                  variant={selectedTheme === themeOption ? "default" : "outline"}
                  onClick={() => handleThemeChange(themeOption)}
                  className="flex flex-col items-center justify-center rounded-xl border-2 p-4 h-auto hover:border-primary transition-all data-[state=active]:border-primary data-[state=active]:ring-2 data-[state=active]:ring-primary"
                  data-state={selectedTheme === themeOption ? "active" : "inactive"}
                >
                  {themeOption === 'light' && <Sun className="h-8 w-8 mb-2" />}
                  {themeOption === 'dark' && <Moon className="h-8 w-8 mb-2" />}
                  {themeOption === 'system' && <Laptop className="h-8 w-8 mb-2" />}
                  <span className="font-body capitalize">{themeOption}</span>
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center"><KeyRound className="mr-3 h-6 w-6 text-accent" />Manage API Keys</CardTitle>
          <CardDescription className="font-body">Configure API keys, quotas, and priority. Changes to rank, duplications, or deletions of copies are reflected immediately in the list but require saving to persist. All other changes (keys, quotas) are finalized on "Save All API Key Changes".</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Accordion type="multiple" defaultValue={["active-apis", "dormant-apis"]} className="w-full space-y-6">
            <AccordionItem value="active-apis" className="border border-border/50 rounded-2xl bg-card/80 overflow-hidden">
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/10 text-xl font-headline">
                <div className="flex items-center"><ListChecks className="mr-3 h-6 w-6 text-green-500" /> Active API Configurations ({activeApis.length})</div>
              </AccordionTrigger>
              <AccordionContent className="px-4 sm:px-6 pb-6 space-y-6">
                {activeApis.length > 0 ? activeApis.map((apiConfig, idx) => {
                  const currentData = getApiKeyDisplayData(apiConfig.configId) || apiConfig; // Use current state for display
                  const remainingQuota = (currentData.dailyQuota ?? 0) - (currentData.usageToday ?? 0);
                  const quotaReached = currentData.dailyQuota !== undefined && remainingQuota <= 0;
                  return (
                    <Card key={apiConfig.configId} className="p-4 rounded-xl border hover:shadow-md transition-shadow bg-background/70">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
                        <div className="flex items-center flex-wrap gap-x-2">
                           <Label className="font-body text-lg font-semibold flex items-center">
                            {quotaReached && <AlertTriangle className="h-5 w-5 text-destructive mr-2" />}
                            {currentData.name} (Rank {currentData.rank !== undefined ? currentData.rank + 1 : 'N/A'})
                          </Label>
                          <div className="flex space-x-1">
                            <Button variant="ghost" size="icon" onClick={() => handleMoveApi(apiConfig.configId, 'up')} disabled={currentData.rank === 0} className="h-8 w-8 rounded-lg">
                              <ArrowUp className="h-5 w-5" /> <span className="sr-only">Move Up</span>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleMoveApi(apiConfig.configId, 'down')} disabled={currentData.rank === activeApis.length - 1} className="h-8 w-8 rounded-lg">
                              <ArrowDown className="h-5 w-5" /> <span className="sr-only">Move Down</span>
                            </Button>
                             <Button variant="ghost" size="icon" onClick={() => handleDuplicateApi(apiConfig.configId)} className="h-8 w-8 rounded-lg" title="Duplicate API Configuration">
                              <Copy className="h-5 w-5" /> <span className="sr-only">Duplicate</span>
                            </Button>
                            {currentData.isDeletable && (
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteApiInitiate(apiConfig.configId)} className="h-8 w-8 rounded-lg text-destructive hover:text-destructive" title="Delete API Configuration">
                                <Trash2 className="h-5 w-5" /> <span className="sr-only">Delete</span>
                              </Button>
                            )}
                          </div>
                        </div>
                        {currentData.docsLink && (
                          <a href={currentData.docsLink} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center font-body mt-2 sm:mt-0">
                            API Docs <ExternalLink className="ml-1 h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor={`api-key-${apiConfig.configId}`} className="font-body text-sm text-muted-foreground">API Key</Label>
                          <Input
                            id={`api-key-${apiConfig.configId}`}
                            type="password"
                            value={currentData.apiKey}
                            onChange={(e) => handleApiKeyChange(apiConfig.configId, e.target.value)}
                            placeholder="Enter API Key"
                            className="w-full font-body rounded-lg bg-background/80 mt-1"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor={`quota-${apiConfig.configId}`} className="font-body text-sm text-muted-foreground">Daily Quota</Label>
                                <Input
                                    id={`quota-${apiConfig.configId}`}
                                    type="number"
                                    value={currentData.dailyQuota ?? ''}
                                    onChange={(e) => handleQuotaChange(apiConfig.configId, e.target.value)}
                                    placeholder="e.g., 100"
                                    className="w-full font-body rounded-lg bg-background/80 mt-1"
                                />
                            </div>
                            <div className="pt-1">
                                <p className="font-body text-sm text-muted-foreground mt-1">
                                Usage Today: {currentData.usageToday ?? 0} / {currentData.dailyQuota ?? 'N/A'}
                                </p>
                                <p className={`font-body text-sm mt-1 ${quotaReached ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                                Remaining: {currentData.dailyQuota !== undefined ? Math.max(0, remainingQuota) : 'N/A'}
                                </p>
                            </div>
                        </div>
                         <Button variant="outline" size="sm" onClick={() => handleResetUsage(apiConfig.configId)} className="rounded-lg font-body">
                            <RefreshCcw className="mr-2 h-4 w-4" /> Reset Usage (on Save)
                        </Button>
                      </div>
                    </Card>
                  )
                }) : <p className="text-muted-foreground text-center py-4 font-body">No API configurations are currently active. Add an API key below and save changes.</p>}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="dormant-apis" className="border border-border/50 rounded-2xl bg-card/80 overflow-hidden">
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/10 text-xl font-headline">
                 <div className="flex items-center"><Archive className="mr-3 h-6 w-6 text-gray-500" /> Dormant API Configurations ({dormantApis.length})</div>
              </AccordionTrigger>
              <AccordionContent className="px-4 sm:px-6 pb-6 space-y-6">
                {dormantApis.length > 0 ? dormantApis.map(apiConfig => {
                  const currentData = getApiKeyDisplayData(apiConfig.configId) || apiConfig;
                  return (
                  <Card key={apiConfig.configId} className="p-4 rounded-xl border bg-background/70">
                     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
                        <Label htmlFor={`api-key-${apiConfig.configId}`} className="font-body text-lg font-semibold">{currentData.name}</Label>
                        <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                            {currentData.docsLink && (
                            <a href={currentData.docsLink} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center font-body">
                                API Docs <ExternalLink className="ml-1 h-3 w-3" />
                            </a>
                            )}
                            {currentData.isDeletable && (
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteApiInitiate(apiConfig.configId)} className="h-8 w-8 rounded-lg text-destructive hover:text-destructive" title="Delete API Configuration">
                                <Trash2 className="h-5 w-5" /> <span className="sr-only">Delete</span>
                                </Button>
                            )}
                        </div>
                      </div>
                    <Input
                      id={`api-key-${apiConfig.configId}`}
                      type="password"
                      value={currentData.apiKey}
                      onChange={(e) => handleApiKeyChange(apiConfig.configId, e.target.value)}
                      placeholder="Enter API Key to activate"
                      className="w-full font-body rounded-lg bg-background/80"
                    />
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        <div>
                            <Label htmlFor={`quota-dormant-${apiConfig.configId}`} className="font-body text-sm text-muted-foreground">Daily Quota (Optional)</Label>
                            <Input
                                id={`quota-dormant-${apiConfig.configId}`}
                                type="number"
                                value={currentData.dailyQuota ?? ''}
                                onChange={(e) => handleQuotaChange(apiConfig.configId, e.target.value)}
                                placeholder="Default: 100"
                                className="w-full font-body rounded-lg bg-background/80 mt-1"
                            />
                        </div>
                    </div>
                  </Card>
                )}) : <p className="text-muted-foreground text-center py-4 font-body">All pre-defined API configurations have keys and are active, or no duplicate copies exist.</p>}
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {areApiKeysInitialized && (
            <Button onClick={handleSaveAllApiChanges} className="w-full sm:w-auto rounded-2xl btn-pulse-hover font-body mt-6">
              <Save className="mr-2 h-5 w-5" /> Save All API Key Changes
            </Button>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={apiToDelete !== null} onOpenChange={(open) => !open && setApiToDelete(null)}>
        <AlertDialogContent className="rounded-2xl font-body">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-headline">Confirm API Configuration Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the API configuration for "{apiToDelete?.name}"?
              This action will remove it from your list. Save changes to make this permanent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setApiToDelete(null)} className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteApiConfirm} className="bg-destructive hover:bg-destructive/90 rounded-xl">Delete from List</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};

export default ProfilePage;
    

