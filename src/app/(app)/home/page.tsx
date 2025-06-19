
"use client";

import { useState, useEffect, type FormEvent, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Search, PlusCircle, Loader2, AlertTriangle, Briefcase, MessageSquareText, Rows, Sparkles, Settings2, AlertCircle, Archive, ArchiveRestore, Trash2, Zap } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import type { HistoryItem } from '@/app/(app)/history/page';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import type { ApiKeyEntry as ProfileApiKeyEntry } from '@/app/(app)/profile/page';


export interface Project {
  id: string;
  name: string;
  isArchived: boolean;
}

export interface HomePageApiConfig extends ProfileApiKeyEntry {}


interface RequestDetails {
  url: string;
  method: 'GET' | 'POST';
  headers: HeadersInit;
  body: any;
}

interface SupportedApiProvider {
  providerId: string;
  name: string;
  docsLink: string;
  defaultModel?: string;
  buildRequestDetails: (query: string, apiKey: string, model?: string, context?: string) => RequestDetails;
  parseResponse: (responseData: any) => string;
}

const SUPPORTED_API_PROVIDERS: SupportedApiProvider[] = [
   {
    providerId: 'gemini',
    name: 'Google Gemini',
    docsLink: 'https://ai.google.dev/docs',
    buildRequestDetails: (query, apiKey, _model, context) => ({
      url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { contents: [{ parts: [{ text: context ? `${context}\n\nBased on the above, please respond to: ${query}` : query }] }] },
    }),
    parseResponse: (data) => {
      try {
        return data?.candidates?.[0]?.content?.parts?.[0]?.text || "No content found in Gemini response.";
      } catch (e) {
        console.error("Error parsing Gemini response:", e, data);
        return "Error parsing Gemini response.";
      }
    },
  },
  {
    providerId: 'huggingface',
    name: 'Hugging Face',
    docsLink: 'https://huggingface.co/docs/api-inference/quicktour',
    defaultModel: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
    buildRequestDetails: (query, apiKey, model, context) => ({
      url: `https://api-inference.huggingface.co/models/${model || 'mistralai/Mixtral-8x7B-Instruct-v0.1'}`,
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: { inputs: context ? `${context}\n\nBased on the above, please respond to: ${query}` : query, parameters: { return_full_text: false, max_new_tokens: 500 } },
    }),
    parseResponse: (data) => {
       try {
        return data?.[0]?.generated_text || "No content found in Hugging Face response.";
      } catch (e) {
        console.error("Error parsing Hugging Face response:", e, data);
        return "Error parsing Hugging Face response.";
      }
    },
  },
  {
    providerId: 'replicate',
    name: 'Replicate',
    docsLink: 'https://replicate.com/mistralai/mistral-7b-instruct-v0.1/api',
    defaultModel: 'mistralai/mistral-7b-instruct-v0.1:83b6a56e7c828e667f21fd596c338fd4f0039b46bcfa18d973e8e70e455fda70',
    buildRequestDetails: (query, apiKey, modelVersion, context) => ({
      url: `https://api.replicate.com/v1/predictions`,
      method: 'POST',
      headers: { 'Authorization': `Token ${apiKey}`, 'Content-Type': 'application/json' },
      body: {
        version: modelVersion ? modelVersion.split(':')[1] : '83b6a56e7c828e667f21fd596c338fd4f0039b46bcfa18d973e8e70e455fda70',
        input: { prompt: `<s>[INST] ${context ? `${context}\n\nBased on the above, please respond to: ${query}` : query} [/INST]` }
      }
    }),
    parseResponse: (data) => {
      if (data?.output) {
        return Array.isArray(data.output) ? data.output.join('') : String(data.output);
      }
      if (data?.id && data?.status) {
        return `Prediction started (ID: ${data.id}, Status: ${data.status}). Result retrieval for Replicate is async and not fully implemented for immediate display in this demo.`;
      }
      return "Could not parse Replicate response or it's an async job.";
    },
  },
  {
    providerId: 'deepseek',
    name: 'DeepSeek',
    defaultModel: 'deepseek-chat',
    docsLink: 'https://platform.deepseek.com/api-docs/',
    buildRequestDetails: (query, apiKey, model, context) => ({
      url: 'https://api.deepseek.com/chat/completions',
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: { model: model || 'deepseek-chat', messages: [{role: 'user', content: context ? `${context}\n\nBased on the above, please respond to: ${query}` : query}] },
    }),
    parseResponse: (data) => {
      try {
        return data?.choices?.[0]?.message?.content || "No content found in DeepSeek response.";
      } catch (e) {
        console.error("Error parsing DeepSeek response:", e, data);
        return "Error parsing DeepSeek response.";
      }
    },
  },
  {
    providerId: 'openai',
    name: 'OpenAI',
    defaultModel: 'gpt-3.5-turbo',
    docsLink: 'https://platform.openai.com/docs/api-reference/chat',
    buildRequestDetails: (query, apiKey, model, context) => ({
      url: 'https://api.openai.com/v1/chat/completions',
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: { model: model || 'gpt-3.5-turbo', messages: [{role: 'user', content: context ? `${context}\n\nBased on the above, please respond to: ${query}` : query}] },
    }),
    parseResponse: (data) => {
      try {
        return data?.choices?.[0]?.message?.content || "No content found in OpenAI response.";
      } catch (e) {
        console.error("Error parsing OpenAI response:", e, data);
        return "Error parsing OpenAI response.";
      }
    },
  },
  {
    providerId: 'anthropic',
    name: 'Anthropic (Claude)',
    defaultModel: 'claude-3-haiku-20240307',
    docsLink: 'https://docs.anthropic.com/claude/reference/messages_post',
    buildRequestDetails: (query, apiKey, model, context) => ({
      url: 'https://api.anthropic.com/v1/messages',
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: { model: model || 'claude-3-haiku-20240307', max_tokens: 1024, messages: [{role: 'user', content: context ? `${context}\n\nBased on the above, please respond to: ${query}` : query}] },
    }),
    parseResponse: (data) => {
      try {
        return data?.content?.[0]?.text || "No content found in Anthropic response.";
      } catch (e) {
        console.error("Error parsing Anthropic response:", e, data);
        return "Error parsing Anthropic response.";
      }
    },
  },
  {
    providerId: 'mistralai',
    name: 'Mistral AI',
    defaultModel: 'mistral-tiny',
    docsLink: 'https://docs.mistral.ai/api-reference/#operation/createChatCompletion',
    buildRequestDetails: (query, apiKey, model, context) => ({
      url: 'https://api.mistral.ai/v1/chat/completions',
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: { model: model || 'mistral-tiny', messages: [{role: 'user', content: context ? `${context}\n\nBased on the above, please respond to: ${query}` : query}] },
    }),
    parseResponse: (data) => {
      try {
        return data?.choices?.[0]?.message?.content || "No content found in Mistral AI response.";
      } catch (e) {
        console.error("Error parsing Mistral AI response:", e, data);
        return "Error parsing Mistral AI response.";
      }
    },
  },
];

const DEFAULT_PROJECT_ID = 'default_project_1';
const DEFAULT_PROJECT_NAME = 'Seeker’s Curiosity (Default)';

const initialDefaultProjects: Project[] = [{ id: DEFAULT_PROJECT_ID, name: DEFAULT_PROJECT_NAME, isArchived: false }];

type SearchModeId = 'standard' | 'multi-source' | 'summary' | 'conflict' | 'custom';

interface SearchMode {
  id: SearchModeId;
  label: string;
  description: string;
  icon: React.ElementType;
}

const SEARCH_MODES: SearchMode[] = [
  { id: 'standard', label: 'Standard Search', description: 'Queries APIs one by one based on rank until a result is found.', icon: Search },
  { id: 'multi-source', label: 'Multi-Source', description: 'Queries all active APIs concurrently and displays their responses.', icon: Rows },
  { id: 'summary', label: 'Summary View', description: 'Gathers information from all active APIs and uses the top-ranked API to summarize.', icon: Sparkles },
  { id: 'conflict', label: 'Conflict Checker', description: 'Compares responses from all active APIs to highlight contradictions and unique findings.', icon: Zap },
  { id: 'custom', label: 'Custom API Select', description: 'Manually choose which APIs to query and how to display results.', icon: Settings2 },
];

type SummaryStyle = 'brief' | 'list' | 'detailed';

interface MultiSourceResult {
  providerName: string;
  resultText?: string;
  error?: string;
  isLoading: boolean;
}
interface ConflictRawResult extends MultiSourceResult {}


export default function HomePage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [projects, setProjects] = useState<Project[]>([]);
  const [isProjectsInitialized, setIsProjectsInitialized] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);
  const [isSelProjIdInitialized, setIsSelProjIdInitialized] = useState(false);

  const [apiConfigs, setApiConfigs] = useState<HomePageApiConfig[]>([]);
  const [areApiConfigsLoaded, setAreApiConfigsLoaded] = useState(false);


  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] = useState(false);
  const [isManageProjectsDialogOpen, setIsManageProjectsDialogOpen] = useState(false);
  const [projectToDeleteId, setProjectToDeleteId] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState('');

  const [searchMode, setSearchMode] = useState<SearchModeId>('standard');
  const [summaryStyle, setSummaryStyle] = useState<SummaryStyle>('brief');
  const [isCustomApiDialogOpen, setIsCustomApiDialogOpen] = useState(false);
  const [customSelectedApis, setCustomSelectedApis] = useState<Set<string>>(new Set());
  const [customDisplayFormat, setCustomDisplayFormat] = useState<'side-by-side' | 'summarized'>('side-by-side');


  const [standardSearchResult, setStandardSearchResult] = useState<string | null>(null);
  const [multiSourceResults, setMultiSourceResults] = useState<MultiSourceResult[]>([]);
  const [summaryResult, setSummaryResult] = useState<string | null>(null);
  const [conflictAnalysisResult, setConflictAnalysisResult] = useState<string | null>(null);
  const [conflictRawResults, setConflictRawResults] = useState<ConflictRawResult[]>([]);
  const [customApiResult, setCustomApiResult] = useState<string | null>(null);


  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false); 
  const [currentApiError, setCurrentApiError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let loadedProjects: Project[];
    const storedProjects = localStorage.getItem('vaultOfSeekersProjects');
    if (storedProjects) {
      try {
        const parsedProjects = JSON.parse(storedProjects) as Project[];
        if (Array.isArray(parsedProjects)) {
            loadedProjects = parsedProjects.map(p => ({ ...p, isArchived: p.isArchived === undefined ? false : p.isArchived }));
            
            let defaultProject = loadedProjects.find(p => p.id === DEFAULT_PROJECT_ID);
            if (defaultProject) {
                defaultProject.name = DEFAULT_PROJECT_NAME;
                defaultProject.isArchived = false;
            } else {
                loadedProjects.unshift({ id: DEFAULT_PROJECT_ID, name: DEFAULT_PROJECT_NAME, isArchived: false });
            }
        } else {
            loadedProjects = [...initialDefaultProjects];
        }
      } catch(e) {
        console.error("Error parsing projects from localStorage, using defaults:", e);
        loadedProjects = [...initialDefaultProjects];
      }
    } else {
      loadedProjects = [...initialDefaultProjects];
    }
    setProjects(loadedProjects);
    localStorage.setItem('vaultOfSeekersProjects', JSON.stringify(loadedProjects));
    setIsProjectsInitialized(true);
  }, []);


  useEffect(() => {
    if (typeof window !== 'undefined' && isProjectsInitialized) {
      const currentProjects = projects.map(p => {
          if (p.id === DEFAULT_PROJECT_ID) {
              return { ...p, name: DEFAULT_PROJECT_NAME, isArchived: false };
          }
          return p;
      });
      if (!currentProjects.find(p => p.id === DEFAULT_PROJECT_ID)) {
          currentProjects.unshift({ id: DEFAULT_PROJECT_ID, name: DEFAULT_PROJECT_NAME, isArchived: false });
      }
      localStorage.setItem('vaultOfSeekersProjects', JSON.stringify(currentProjects));
    }
  }, [projects, isProjectsInitialized]);


  useEffect(() => {
    if (typeof window === 'undefined' || !isProjectsInitialized || projects.length === 0) return;
    
    if (searchParams.get('project')) {
        setIsSelProjIdInitialized(true); 
        return;
    }

    let currentSelectedId: string | undefined = undefined;
    const lastSelectedProjectId = localStorage.getItem('vaultOfSeekersLastSelectedProject');
    const activeProjects = projects.filter(p => !p.isArchived);

    if (activeProjects.length > 0) {
        currentSelectedId = activeProjects.find(p => p.id === DEFAULT_PROJECT_ID) ? DEFAULT_PROJECT_ID : activeProjects[0].id;
        if (lastSelectedProjectId && activeProjects.find(p => p.id === lastSelectedProjectId)) {
            currentSelectedId = lastSelectedProjectId; 
        }
        setSelectedProjectId(currentSelectedId);
        if (currentSelectedId) {
            localStorage.setItem('vaultOfSeekersLastSelectedProject', currentSelectedId);
        }
    } else { 
        setSelectedProjectId(DEFAULT_PROJECT_ID); 
        localStorage.setItem('vaultOfSeekersLastSelectedProject', DEFAULT_PROJECT_ID);
    }
    setIsSelProjIdInitialized(true);
  }, [isProjectsInitialized, projects, searchParams]);


  useEffect(() => {
    if (typeof window === 'undefined' || !isProjectsInitialized || !isSelProjIdInitialized) return;

    const queryFromUrl = searchParams.get('search');
    const projectIdFromUrl = searchParams.get('project');

    if (queryFromUrl) {
      setSearchQuery(queryFromUrl);
    }

    if (projectIdFromUrl) {
      const projectExistsAndIsActive = projects.find(p => p.id === projectIdFromUrl && !p.isArchived);
      if (projectExistsAndIsActive) {
        setSelectedProjectId(projectIdFromUrl);
      } else {
        const projectExistsButArchived = projects.find(p => p.id === projectIdFromUrl && p.isArchived);
        if (projectExistsButArchived) {
            setTimeout(() => {
              toast({title: "Project Archived", description: `Project "${projectExistsButArchived.name}" is archived. Please unarchive it to use. Selecting default.`, variant: "destructive"});
            }, 0);
        } else {
            setTimeout(() => {
              toast({title: "Project Not Found", description: `Project ID "${projectIdFromUrl}" from URL is invalid. Selecting default.`, variant: "destructive"});
            }, 0);
        }
        setSelectedProjectId(DEFAULT_PROJECT_ID);
      }
    } else if (!selectedProjectId && projects.length > 0 && isProjectsInitialized) {
        const defaultProject = projects.find(p => p.id === DEFAULT_PROJECT_ID);
        if (defaultProject && !defaultProject.isArchived) {
            setSelectedProjectId(DEFAULT_PROJECT_ID);
        } else {
            const firstActive = projects.find(p => !p.isArchived);
             setSelectedProjectId(firstActive ? firstActive.id : DEFAULT_PROJECT_ID); 
        }
    }
  }, [searchParams, isProjectsInitialized, projects, toast, isSelProjIdInitialized, selectedProjectId]);


  useEffect(() => {
    if (typeof window !== 'undefined' && isSelProjIdInitialized && selectedProjectId) {
      localStorage.setItem('vaultOfSeekersLastSelectedProject', selectedProjectId);
    }
  }, [selectedProjectId, isSelProjIdInitialized]);



  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedApiConfigs = localStorage.getItem('vaultApiKeysV2');
    let loadedConfigs: HomePageApiConfig[] = [];
    if (storedApiConfigs) {
      try {
        loadedConfigs = JSON.parse(storedApiConfigs) as HomePageApiConfig[];
      } catch (e) { console.error("Error parsing API configurations from localStorage", e); loadedConfigs = []; }
    }
    setApiConfigs(loadedConfigs);
    setAreApiConfigsLoaded(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !areApiConfigsLoaded || apiConfigs.length === 0) return;

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    let configsChanged = false;
    const updatedConfigs = apiConfigs.map(api => {
      if (api.lastResetDate !== todayStr) {
        configsChanged = true;
        return { ...api, usageToday: 0, lastResetDate: todayStr };
      }
      return api;
    });

    if (configsChanged) {
      setApiConfigs(updatedConfigs);
      localStorage.setItem('vaultApiKeysV2', JSON.stringify(updatedConfigs));
    }
  }, [areApiConfigsLoaded, apiConfigs]);


  const getActiveUsableApis = useCallback(() => {
    if (typeof window === 'undefined') return [];
    return apiConfigs
      .filter(api => api.apiKey && api.apiKey.trim() !== '')
      .filter(api => (api.dailyQuota === undefined || api.dailyQuota === null) || (api.usageToday ?? 0) < api.dailyQuota)
      .sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity));
  }, [apiConfigs]);


  const updateApiUsage = useCallback((configIdUsed: string) => {
    setApiConfigs(prevConfigs => {
      const configToUpdate = prevConfigs.find(api => api.configId === configIdUsed);

      if (!configToUpdate) {
        console.warn(`[updateApiUsage] Config ID ${configIdUsed} not found for usage update.`);
        return prevConfigs;
      }
      
      const newUsage = (configToUpdate.usageToday ?? 0) + 1;

      const newConfigs = prevConfigs.map(api =>
        api.configId === configIdUsed ? { ...api, usageToday: newUsage } : api
      );
      if (typeof window !== 'undefined') {
        localStorage.setItem('vaultApiKeysV2', JSON.stringify(newConfigs));
      }
      return newConfigs;
    });
  }, [setApiConfigs]);

  const handleCreateNewProject = () => {
    if (newProjectName.trim() === '') {
      toast({ title: "Error", description: "Project name cannot be empty.", variant: "destructive" });
      return;
    }
    if (newProjectName.trim() === DEFAULT_PROJECT_NAME) {
        toast({ title: "Error", description: `Cannot create a project with the default name: "${DEFAULT_PROJECT_NAME}".`, variant: "destructive"});
        return;
    }
    const newId = `project_${Date.now().toString()}`;
    const newProjectData: Project = { id: newId, name: newProjectName.trim(), isArchived: false };
    setProjects(prevProjects => [...prevProjects, newProjectData]);
    setSelectedProjectId(newId); 
    setNewProjectName('');
    setIsCreateProjectDialogOpen(false);
    toast({ title: "Success", description: `Project "${newProjectData.name}" created.` });
  };

  const handleToggleArchiveProject = (projectId: string) => {
    if (projectId === DEFAULT_PROJECT_ID) {
        toast({ title: "Action Not Allowed", description: `"${DEFAULT_PROJECT_NAME}" cannot be archived.`, variant: "destructive"});
        return;
    }
    setProjects(prevProjects => {
        const updatedProjects = prevProjects.map(p => 
            p.id === projectId ? { ...p, isArchived: !p.isArchived } : p
        );

        const projectBeingToggled = updatedProjects.find(p => p.id === projectId);
        if (projectBeingToggled && projectBeingToggled.isArchived && selectedProjectId === projectId) {
            const firstActiveProject = updatedProjects.find(p => !p.isArchived && p.id !== DEFAULT_PROJECT_ID) || updatedProjects.find(p => p.id === DEFAULT_PROJECT_ID);
            setSelectedProjectId(firstActiveProject ? firstActiveProject.id : undefined);
            if (!firstActiveProject || firstActiveProject.id === DEFAULT_PROJECT_ID) {
                toast({ title: "Project Archived", description: `"${projectBeingToggled.name}" archived. Switched to "${DEFAULT_PROJECT_NAME}".`, variant: "default"});
            } else {
                 toast({ title: "Project Archived", description: `"${projectBeingToggled.name}" archived. Switched to "${firstActiveProject.name}".`, variant: "default"});
            }
        } else if (projectBeingToggled && !projectBeingToggled.isArchived) {
             toast({ title: "Project Unarchived", description: `"${projectBeingToggled.name}" is now active.`});
             if (!selectedProjectId) { 
                setSelectedProjectId(projectBeingToggled.id);
             }
        }
        return updatedProjects;
    });
  };

  const handleDeleteProjectInitiate = (projectId: string) => {
    if (projectId === DEFAULT_PROJECT_ID) {
        toast({ title: "Action Not Allowed", description: `"${DEFAULT_PROJECT_NAME}" cannot be deleted.`, variant: "destructive"});
        return;
    }
    setProjectToDeleteId(projectId);
  };

  const handleDeleteProjectConfirm = () => {
    if (!projectToDeleteId || projectToDeleteId === DEFAULT_PROJECT_ID) return;

    setProjects(prevProjects => {
      const projectBeingDeleted = prevProjects.find(p => p.id === projectToDeleteId);
      const remainingProjects = prevProjects.filter(p => p.id !== projectToDeleteId);
      
      if (selectedProjectId === projectToDeleteId) {
        const firstActiveProject = remainingProjects.find(p => !p.isArchived && p.id !== DEFAULT_PROJECT_ID) || remainingProjects.find(p => p.id === DEFAULT_PROJECT_ID);
        setSelectedProjectId(firstActiveProject ? firstActiveProject.id : undefined); 
        if (firstActiveProject && firstActiveProject.id !== DEFAULT_PROJECT_ID) {
             toast({ title: "Project Deleted", description: `"${projectBeingDeleted?.name}" deleted. Switched to "${firstActiveProject.name}".` });
        } else {
             toast({ title: "Project Deleted", description: `"${projectBeingDeleted?.name}" deleted. Switched to "${DEFAULT_PROJECT_NAME}".` });
        }
      } else {
        toast({ title: "Project Deleted", description: `"${projectBeingDeleted?.name}" has been deleted.` });
      }
      return remainingProjects;
    });
    setProjectToDeleteId(null);
  };

  const handleDeleteProjectCancel = () => {
    setProjectToDeleteId(null);
  };


  const fetchFromProvider = async (
    apiConfigEntry: HomePageApiConfig,
    query: string,
    contextForSummarization?: string 
  ): Promise<{ providerName: string, resultText?: string, error?: string }> => {
    const providerDetail = SUPPORTED_API_PROVIDERS.find(p => p.providerId === apiConfigEntry.providerId);
    if (!providerDetail) {
      return { providerName: apiConfigEntry.name, error: "Provider details not found for this configuration." };
    }

    try {
      const { url, method, headers: reqHeaders, body } = providerDetail.buildRequestDetails(query, apiConfigEntry.apiKey, apiConfigEntry.defaultModel || providerDetail.defaultModel, contextForSummarization);
      
      const response = await fetch(url, {
        method,
        headers: reqHeaders,
        body: method === 'POST' ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
      });

      if (!response.ok) {
        let errorDataText = "Could not retrieve error details.";
        try { const errorData = await response.json(); errorDataText = JSON.stringify(errorData, null, 2); }
        catch (parseErr) { try { errorDataText = await response.text(); } catch (textErr) { /* stick to initial */ } }
        console.error(`API Error from ${providerDetail.name} (${response.status}):`, errorDataText);
        return { providerName: providerDetail.name, error: `API Error (${response.status}): ${errorDataText.substring(0, 300)}`};
      }

      const responseData = await response.json();
      const resultText = providerDetail.parseResponse(responseData);
      updateApiUsage(apiConfigEntry.configId); 
      return { providerName: providerDetail.name, resultText };

    } catch (error: any) {
      console.error(`Search error with ${providerDetail.name}:`, error);
      return { providerName: providerDetail.name, error: (error.message || `An unexpected error occurred.`).substring(0,300) };
    }
  };

  const executeStandardSearch = async (query: string, project: Project) => {
    setIsLoading(true);
    setCurrentApiError(null);
    setStandardSearchResult(null);

    const usableApis = getActiveUsableApis();

    let success = false;
    let lastErrorFromAttempt: string | null = null;
    for (const apiToTry of usableApis) { 
      const { resultText, error, providerName } = await fetchFromProvider(apiToTry, query);
      if (resultText) {
        setStandardSearchResult(resultText);
        setCurrentApiError(null);
        success = true;
        saveToHistory(query, `${providerName} (Standard) Search`, project, resultText);
        break;
      } else if (error) {
        lastErrorFromAttempt = `Error from ${providerName}: ${error}`;
      }
    }

    if (!success && lastErrorFromAttempt) {
        setCurrentApiError(lastErrorFromAttempt);
        setTimeout(() => toast({ title: "Search Failed", description: lastErrorFromAttempt, variant: "destructive" }), 0);
    } else if (!success && usableApis.length > 0) { 
        const finalError = "All available APIs failed or were skipped. Check configurations.";
        setCurrentApiError(finalError);
        setTimeout(() => toast({ title: "Search Failed", description: finalError, variant: "destructive" }), 0);
    }
    setIsLoading(false);
  };

  const executeMultiSourceSearch = async (query: string, project: Project) => {
    setIsLoading(true);
    setCurrentApiError(null);
    setMultiSourceResults([]);

    const usableApis = getActiveUsableApis();

    setMultiSourceResults(usableApis.map(api => ({ providerName: api.name, isLoading: true })));

    const results = await Promise.allSettled(
      usableApis.map(apiToTry => fetchFromProvider(apiToTry, query))
    );

    const finalResults: MultiSourceResult[] = results.map((pResult, index) => {
      const apiUsed = usableApis[index];
      if (pResult.status === 'fulfilled') {
        if (pResult.value.resultText) {
          saveToHistory(query, `${apiUsed.name} (Multi-Source) Search`, project, pResult.value.resultText);
          return { providerName: apiUsed.name, resultText: pResult.value.resultText, isLoading: false };
        }
        return { providerName: apiUsed.name, error: pResult.value.error || "Unknown error", isLoading: false };
      }
      return { providerName: apiUsed.name, error: (pResult.reason as Error)?.message || "Failed to fetch", isLoading: false };
    });

    setMultiSourceResults(finalResults);
    setIsLoading(false);
    if (finalResults.length > 0 && finalResults.every(r => r.error)) {
        setCurrentApiError("All APIs in multi-source search failed or returned errors.");
        setTimeout(() => toast({title: "Multi-Source Search Issue", description: "All APIs returned errors.", variant: "destructive"}), 0);
    }
  };

  const executeSummarySearch = async (query: string, project: Project) => {
    setIsLoading(true);
    setIsAnalyzing(false);
    setCurrentApiError(null);
    setSummaryResult(null); 

    const usableApis = getActiveUsableApis();

    const rankOneApi = usableApis.find(api => api.rank === 0); 
    if (!rankOneApi) {
        setCurrentApiError("No Rank #1 API available for summarization. Please set ranks on the Profile page.");
        setTimeout(() => toast({ title: "Rank #1 API Missing", description: "Summarization requires a ranked API.", variant: "destructive" }), 0);
        setIsLoading(false);
        return;
    }
    
    setSummaryResult(`Gathering context from ${usableApis.length} sources for Rank #1 API (${rankOneApi.name}) to summarize...`);

    const contextResults = await Promise.allSettled(
      usableApis.map(apiToTry => fetchFromProvider(apiToTry, query))
    );

    let combinedContext = "";
    contextResults.forEach((pResult, index) => {
      if (pResult.status === 'fulfilled' && pResult.value.resultText) {
        combinedContext += `Source: ${usableApis[index].name}\nResult: """${pResult.value.resultText}"""\n\n---\n\n`;
        saveToHistory(query, `${usableApis[index].name} (Context for Summary) Search`, project, pResult.value.resultText);
      }
    });

    if (!combinedContext.trim()) {
        setSummaryResult("Could not gather sufficient context for summary.");
        setCurrentApiError("No context gathered from APIs for summary.");
        setIsLoading(false);
        return;
    }
    
    setIsAnalyzing(true);
    setSummaryResult(`Summarizing with ${rankOneApi.name} (Style: ${summaryStyle})...`);

    const summaryInstructionPrompt = `Based on the following information from multiple sources, provide a ${summaryStyle} summary for the original query: "${query}".`;
    
    const { resultText, error } = await fetchFromProvider(rankOneApi, summaryInstructionPrompt, combinedContext);


    if (resultText) {
      setSummaryResult(resultText);
      saveToHistory(query, `Summary by ${rankOneApi.name} (Style: ${summaryStyle})`, project, resultText);
    } else {
      setSummaryResult(null);
      const errorMsg = `Error from ${rankOneApi.name} during summarization: ${error || 'Failed to summarize'}`;
      setCurrentApiError(errorMsg);
      setTimeout(() => toast({title: "Summarization Failed", description: errorMsg, variant: "destructive"}), 0);
    }
    setIsAnalyzing(false);
    setIsLoading(false);
  };

const executeConflictCheckSearch = async (query: string, project: Project) => {
    setIsLoading(true);
    setIsAnalyzing(false); 
    setCurrentApiError(null);
    setConflictAnalysisResult(null); 
    setConflictRawResults([]); 

    const usableApis = getActiveUsableApis();
     if (usableApis.length < 1) { 
      setCurrentApiError("Not enough active APIs available for conflict check. At least one needed.");
      setTimeout(() => toast({ title: "Conflict Check Unavailable", description: "Need active APIs for comparison.", variant: "destructive" }), 0);
      setIsLoading(false);
      return;
    }


    const rankOneApi = usableApis.find(api => api.rank === 0);
    if (!rankOneApi) {
      setCurrentApiError("No Rank #1 API available for conflict analysis. Please set ranks on the Profile page.");
      setTimeout(() => toast({ title: "Rank #1 API Missing", description: "Conflict analysis requires a ranked API.", variant: "destructive" }), 0);
      setIsLoading(false);
      return;
    }
    
    setConflictAnalysisResult("Collecting information from multiple sources...");
    setConflictRawResults(usableApis.map(api => ({ providerName: api.name, isLoading: true })));

    const rawResultsPromises = usableApis.map(apiToTry => fetchFromProvider(apiToTry, query));
    const settledRawResults = await Promise.allSettled(rawResultsPromises);

    const fetchedRawResultsUpdate: ConflictRawResult[] = settledRawResults.map((pResult, index) => {
      const apiUsed = usableApis[index];
      if (pResult.status === 'fulfilled') {
        if(pResult.value.resultText) saveToHistory(query, `${apiUsed.name} (Context for Conflict Check) Search`, project, pResult.value.resultText);
        return { providerName: apiUsed.name, resultText: pResult.value.resultText, error: pResult.value.error, isLoading: false };
      }
      return { providerName: apiUsed.name, error: (pResult.reason as Error)?.message || "Failed to fetch", isLoading: false };
    });
    setConflictRawResults(fetchedRawResultsUpdate);

    const successfulRawResults = fetchedRawResultsUpdate.filter(r => r.resultText && !r.error);
    if (successfulRawResults.length === 0) {
      setCurrentApiError("Could not retrieve results from any API for conflict analysis.");
      setConflictAnalysisResult("Conflict analysis failed: No successful API responses were available to analyze.");
      setTimeout(() => toast({ title: "Conflict Check Failed", description: "No API returned a successful result for analysis.", variant: "destructive" }), 0);
      setIsLoading(false);
      return;
    }
    
    if (successfulRawResults.length === 1) { 
        const analysisText = `Only one result from ${successfulRawResults[0].providerName}. No other results to compare for conflicts.`;
        setConflictAnalysisResult(analysisText);
        setIsLoading(false);
        setIsAnalyzing(false);
        saveToHistory(query, `Conflict Analysis by ${successfulRawResults[0].providerName} (Single Result)`, project, analysisText);
        return;
    }


    setIsAnalyzing(true);
    setConflictAnalysisResult(`Analyzing differences with ${rankOneApi.name}...`);

    const analysisPromptParts = successfulRawResults.map(res => 
        `Source: ${res.providerName}\nResult: """${res.resultText?.replace(/"/g, '""')}"""`
    );
    const analysisPrompt = `User Query: "${query}"\n\nBased on the user query, compare the following API responses. Identify key differences, contradictions, or unique pieces of information. If all responses are substantially similar in their core message regarding the user query, respond with the exact phrase: "All results substantially match." Do NOT add any other text if they match. Otherwise, detail the discrepancies.\n\n--- Collected API Responses ---\n${analysisPromptParts.join('\n\n---\n\n')}`;
        
    const { resultText: analysis, error: analysisError } = await fetchFromProvider(rankOneApi, analysisPrompt, undefined);

    if (analysis) {
      setConflictAnalysisResult(analysis);
      saveToHistory(query, `Conflict Analysis by ${rankOneApi.name}`, project, analysis);
    } else {
      const errorMsg = `Error from ${rankOneApi.name} during conflict analysis: ${analysisError || 'Failed to analyze conflicts'}`;
      setConflictAnalysisResult(`Conflict analysis failed: ${errorMsg}`);
      setCurrentApiError(errorMsg);
      setTimeout(() => toast({title: "Conflict Analysis Failed", description: errorMsg, variant: "destructive"}), 0);
    }
    setIsAnalyzing(false);
    setIsLoading(false);
  };


  const executeCustomApiSearch = async (query: string, project: Project) => {
    setIsLoading(true);
    setIsAnalyzing(false);
    setCurrentApiError(null);
    setMultiSourceResults([]); 
    setCustomApiResult(null); 

    if (customSelectedApis.size === 0) {
        setTimeout(() => toast({title: "No APIs Selected", description: "Please select at least one API for custom search.", variant: "destructive"}), 0);
        setIsLoading(false);
        return;
    }

    const allUsableApis = getActiveUsableApis(); 
    const selectedUsableApis = allUsableApis.filter(api => customSelectedApis.has(api.configId));


    if (selectedUsableApis.length === 0) {
      setCurrentApiError("None of the custom-selected APIs are currently available (check keys/quotas).");
      setTimeout(() => toast({ title: "Custom APIs Unavailable", description: "Selected APIs are not usable. Try different ones or check Profile.", variant: "destructive" }), 0);
      setIsLoading(false);
      return;
    }

    if (selectedUsableApis.length === 1) {
      const singleApiToTry = selectedUsableApis[0];
      setMultiSourceResults([{ providerName: singleApiToTry.name, isLoading: true }]);
      const { resultText, error } = await fetchFromProvider(singleApiToTry, query);
      if (resultText) {
        setMultiSourceResults([{ providerName: singleApiToTry.name, resultText, isLoading: false }]);
        saveToHistory(query, `${singleApiToTry.name} (Custom Single) Search`, project, resultText);
      } else {
        const errMessage = error || "Failed to fetch";
        setMultiSourceResults([{ providerName: singleApiToTry.name, error: errMessage, isLoading: false }]);
        setCurrentApiError(`Error from ${singleApiToTry.name}: ${errMessage}`);
        setTimeout(() => toast({title: "Custom Search Failed", description: `Error from ${singleApiToTry.name}: ${errMessage}`, variant: "destructive"}), 0);
      }
    } else { 
        if (customDisplayFormat === 'side-by-side') {
            setMultiSourceResults(selectedUsableApis.map(api => ({ providerName: api.name, isLoading: true })));
            const results = await Promise.allSettled(
                selectedUsableApis.map(apiToTry => fetchFromProvider(apiToTry, query))
            );
            const finalResults: MultiSourceResult[] = results.map((pResult, index) => {
                const apiUsed = selectedUsableApis[index];
                if (pResult.status === 'fulfilled') {
                if (pResult.value.resultText) {
                    saveToHistory(query, `${apiUsed.name} (Custom Multi) Search`, project, pResult.value.resultText);
                    return { providerName: apiUsed.name, resultText: pResult.value.resultText, isLoading: false };
                }
                return { providerName: apiUsed.name, error: pResult.value.error || "Unknown error", isLoading: false };
                }
                return { providerName: apiUsed.name, error: (pResult.reason as Error)?.message || "Failed to fetch", isLoading: false };
            });
            setMultiSourceResults(finalResults);
            if (finalResults.every(r => r.error)) setCurrentApiError("All selected APIs in custom search failed.");
        } else { 
            const rankOneApiOverall = allUsableApis.find(api => api.rank === 0);
            if (!rankOneApiOverall) {
                setCurrentApiError("No Rank #1 API available for summarization in custom mode. Please rank your APIs.");
                setTimeout(() => toast({title:"Rank #1 API Missing", description:"Custom summarization requires a ranked API.", variant:"destructive"}), 0);
                setIsLoading(false);
                return;
            }
            
            setCustomApiResult(`Gathering context from ${selectedUsableApis.length} selected sources for Rank #1 API (${rankOneApiOverall.name}) to summarize...`);
            setIsAnalyzing(true);
            
            const contextResults = await Promise.allSettled(
                selectedUsableApis.map(apiToTry => fetchFromProvider(apiToTry, query))
            );
            let combinedContext = "";
            contextResults.forEach((pResult, index) => {
                if (pResult.status === 'fulfilled' && pResult.value.resultText) {
                    combinedContext += `Source: ${selectedUsableApis[index].name}\nResult: """${pResult.value.resultText?.replace(/"/g, '""')}"""\n\n---\n\n`;
                    saveToHistory(query, `${selectedUsableApis[index].name} (Context for Custom Summary) Search`, project, pResult.value.resultText);
                }
            });

            if (!combinedContext.trim()) {
                setCustomApiResult("Could not gather sufficient context from selected APIs for summary.");
                setCurrentApiError("No context gathered for custom summary.");
                setIsLoading(false);
                setIsAnalyzing(false);
                return;
            }
            
            setCustomApiResult(`Summarizing with ${rankOneApiOverall.name}...`);
            const summaryInstructionPrompt = `Based on the following information from the selected sources, provide a summary for the original query: "${query}".`;
            const { resultText, error } = await fetchFromProvider(rankOneApiOverall, summaryInstructionPrompt, combinedContext);

            if (resultText) {
                setCustomApiResult(resultText);
                saveToHistory(query, `Custom Summary by ${rankOneApiOverall.name}`, project, resultText);
            } else {
                setCustomApiResult(null);
                const errorMsg = `Error from ${rankOneApiOverall.name} during custom summarization: ${error || 'Failed to summarize'}`;
                setCurrentApiError(errorMsg);
                setTimeout(() => toast({title: "Custom Summarization Failed", description: errorMsg, variant: "destructive"}), 0);
            }
            setIsAnalyzing(false);
        }
    }
    setIsLoading(false);
  };


  const handleSearchSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setTimeout(() => toast({ title: "Query Missing", description: "Please enter a search query.", variant: "destructive" }), 0);
      return;
    }
    if (!selectedProjectId) {
      setTimeout(() => toast({ title: "Project Missing", description: "Please select an active project.", variant: "destructive" }), 0);
      return;
    }
    if (!areApiConfigsLoaded) {
      setTimeout(() => toast({ title: "Loading", description: "API configurations still loading.", variant: "destructive" }), 0);
      return;
    }

    const currentProject = projects.find(p => p.id === selectedProjectId && !p.isArchived);
    if (!currentProject) {
        setTimeout(() => toast({ title: "Error", description: "Current project not found or is archived.", variant: "destructive" }), 0);
        return;
    }

    const usableApis = getActiveUsableApis();
    const configuredApisWithKeys = apiConfigs.filter(api => api.apiKey && api.apiKey.trim() !== '');

    if (usableApis.length === 0) {
      setIsLoading(false);
      setIsAnalyzing(false);
      if (configuredApisWithKeys.length > 0) {
        const errorMsg = "No Usable APIs: All configured APIs may have reached their daily quota or are inactive. Please check your Profile page.";
        setCurrentApiError(errorMsg);
        setTimeout(() => toast({ title: "Search Aborted", description: errorMsg, variant: "destructive" }), 0);
      } else {
        const errorMsg = "No APIs Configured: Please add and activate API keys on your Profile page to perform searches.";
        setCurrentApiError(errorMsg);
        setTimeout(() => toast({ title: "Search Aborted", description: errorMsg, variant: "destructive" }), 0);
      }
      return;
    }
    
    setStandardSearchResult(null);
    setMultiSourceResults([]);
    setSummaryResult(null);
    setConflictAnalysisResult(null); 
    setConflictRawResults([]);      
    setCustomApiResult(null);
    setCurrentApiError(null);
    setIsAnalyzing(false);


    switch (searchMode) {
      case 'standard':
        await executeStandardSearch(searchQuery, currentProject);
        break;
      case 'multi-source':
        await executeMultiSourceSearch(searchQuery, currentProject);
        break;
      case 'summary':
        await executeSummarySearch(searchQuery, currentProject);
        break;
      case 'conflict':
        await executeConflictCheckSearch(searchQuery, currentProject);
        break;
      case 'custom':
        await executeCustomApiSearch(searchQuery, currentProject);
        break;
      default:
        setTimeout(() => toast({ title: "Unknown Mode", description: "Selected search mode is not recognized.", variant: "destructive" }), 0);
    }
  };

  const saveToHistory = (query: string, type: string, project: Project, resultText?: string) => {
      const newHistoryEntry: HistoryItem = {
        id: Date.now().toString(),
        query,
        date: format(new Date(), "MMM d, yyyy, p"),
        timestamp: Date.now(),
        type,
        notes: "",
        isFavorite: false,
        projectId: project.id,
        projectName: project.name,
        resultText: resultText,
      };
      if (typeof window !== 'undefined') {
        let currentHistory: HistoryItem[] = [];
        const storedHistory = localStorage.getItem('vaultOfSeekersHistory');
        if (storedHistory) { try { const parsed = JSON.parse(storedHistory); if(Array.isArray(parsed)) currentHistory = parsed; } catch (e) { console.error("Err parsing history",e);}}
        currentHistory.unshift(newHistoryEntry);
        localStorage.setItem('vaultOfSeekersHistory', JSON.stringify(currentHistory.slice(0, 100))); 
      }
  };

  const handleModeChange = (modeId: SearchModeId) => {
    setSearchMode(modeId);
    setCurrentApiError(null);
    setStandardSearchResult(null);
    setMultiSourceResults([]);
    setSummaryResult(null);
    setConflictAnalysisResult(null);
    setConflictRawResults([]);
    setCustomApiResult(null);
    setIsAnalyzing(false);

    if (modeId === 'custom') {
      setIsCustomApiDialogOpen(true);
    } else {
      setIsCustomApiDialogOpen(false);
    }
  };

  const handleCustomApiSelection = (apiConfigId: string, checked: boolean) => {
    setCustomSelectedApis(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(apiConfigId);
      } else {
        newSet.delete(apiConfigId);
      }
      return newSet;
    });
  };

  const isContentTypeJsonOrHtml = (text: string): 'json' | 'html' | 'text' => {
    if (!text) return 'text';
    const trimmedText = text.trim();
    if ((trimmedText.startsWith('{') && trimmedText.endsWith('}')) || (trimmedText.startsWith('[') && trimmedText.endsWith(']'))) {
      try {
        JSON.parse(trimmedText);
        return 'json';
      } catch (e) { /* not JSON */ }
    }
    if (trimmedText.startsWith('<') && trimmedText.endsWith('>')) {
        if (/<[^>]+>/.test(trimmedText)) return 'html';
    }
    return 'text';
  };


  const allKeyedApiConfigs = apiConfigs.filter(api => api.apiKey && api.apiKey.trim() !== '');
  const activeModeDetails = SEARCH_MODES.find(m => m.id === searchMode);
  const activeProjects = projects.filter(p => !p.isArchived && p.id !== DEFAULT_PROJECT_ID);
  const defaultProject = projects.find(p => p.id === DEFAULT_PROJECT_ID);
  const displayableProjects = defaultProject ? [defaultProject, ...activeProjects] : activeProjects;


  return (
    <div className="space-y-8 flex flex-col flex-grow">
      <Card className="shadow-xl border-primary/20 rounded-2xl bg-card/80">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div>
            <Label htmlFor="project-selector" className="font-body text-muted-foreground mb-1 block text-xs">Active Project</Label>
            <div className="flex items-center space-x-2">
              <Select
                value={selectedProjectId}
                onValueChange={(value) => setSelectedProjectId(value)}
                disabled={!isProjectsInitialized || displayableProjects.length === 0 || !isSelProjIdInitialized}
              >
                <SelectTrigger id="project-selector" className="w-full font-body rounded-xl h-11 text-sm">
                  <SelectValue placeholder={!isProjectsInitialized || !isSelProjIdInitialized || displayableProjects.length === 0 ? "Loading projects..." : "Select active project..."} />
                </SelectTrigger>
                <SelectContent className="rounded-xl font-body">
                  <SelectGroup>
                    <SelectLabel>Projects</SelectLabel>
                    {displayableProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                    {isProjectsInitialized && displayableProjects.length === 0 && ( 
                       <SelectItem value="no_active_projects_placeholder" disabled>No projects available.</SelectItem>
                    )}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Dialog open={isCreateProjectDialogOpen} onOpenChange={setIsCreateProjectDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl shrink-0" title="Create New Project" disabled={!isProjectsInitialized}>
                    <PlusCircle className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
                 <DialogContent className="sm:max-w-[425px] rounded-2xl font-body">
                  <DialogHeader>
                    <DialogTitle className="font-headline">Create New Project</DialogTitle>
                    <DialogDescription>Enter a name for your new project. It will be set as active.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <Label htmlFor="new-project-name" className="text-left">Name</Label>
                    <Input id="new-project-name" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} className="rounded-xl" placeholder="Project Name"/>
                  </div>
                  <DialogFooter><DialogClose asChild><Button variant="outline" className="rounded-xl">Cancel</Button></DialogClose><Button type="button" onClick={handleCreateNewProject} className="btn-pulse-hover rounded-xl">Create</Button></DialogFooter>
                </DialogContent>
              </Dialog>
              <Dialog open={isManageProjectsDialogOpen} onOpenChange={setIsManageProjectsDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl shrink-0" title="Manage Projects" disabled={!isProjectsInitialized}>
                        <Settings2 className="h-5 w-5" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg rounded-2xl font-body">
                    <DialogHeader>
                        <DialogTitle className="font-headline">Manage Projects</DialogTitle>
                        <DialogDescription>Archive, unarchive, or delete your projects. "{DEFAULT_PROJECT_NAME}" is non-modifiable.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-4 max-h-[60vh] overflow-y-auto">
                        {projects.length === 0 && <p className="text-muted-foreground text-center">No projects yet. Create one to get started!</p>}
                        {projects.map(project => (
                            <Card key={project.id} className={cn("p-3 rounded-lg", project.id === DEFAULT_PROJECT_ID && "bg-muted/50")}>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <span className="font-semibold">{project.name}</span>
                                        <Badge variant={project.isArchived ? "secondary" : "default"} className="text-xs">
                                            {project.isArchived ? "Archived" : "Active"}
                                        </Badge>
                                    </div>
                                    <div className="flex space-x-1">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={() => handleToggleArchiveProject(project.id)} 
                                            title={project.isArchived ? "Unarchive Project" : "Archive Project"} 
                                            className="h-8 w-8 rounded-md"
                                            disabled={project.id === DEFAULT_PROJECT_ID}
                                        >
                                            {project.isArchived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={() => handleDeleteProjectInitiate(project.id)} 
                                            title="Delete Project" 
                                            className="h-8 w-8 rounded-md text-destructive hover:text-destructive hover:bg-destructive/10"
                                            disabled={project.id === DEFAULT_PROJECT_ID}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline" className="rounded-xl">Close</Button></DialogClose>
                    </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <form onSubmit={handleSearchSubmit} className="space-y-3">
            {searchMode === 'summary' && (
                <div>
                    <Label htmlFor="summary-style-selector" className="font-body text-muted-foreground mb-1 block text-xs">Summary Style</Label>
                    <Select value={summaryStyle} onValueChange={(val) => setSummaryStyle(val as SummaryStyle)} disabled={isLoading || isAnalyzing}>
                        <SelectTrigger id="summary-style-selector" className="w-full md:w-[200px] font-body rounded-xl h-11 text-sm">
                            <SelectValue placeholder="Select style..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl font-body">
                            <SelectItem value="brief">Brief</SelectItem>
                            <SelectItem value="list">List</SelectItem>
                            <SelectItem value="detailed">Detailed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}
            <div>
                <Label htmlFor="search-query" className="font-body text-muted-foreground mb-1 block text-xs">Enter Query</Label>
                <div className="flex space-x-2">
                    <div className="relative flex-grow">
                        <Input
                        id="search-query" type="search" placeholder="What knowledge do you seek...?"
                        className="w-full h-12 pl-10 pr-4 text-base font-body rounded-xl border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/50 bg-background/80"
                        value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} disabled={isLoading || isAnalyzing}
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    </div>
                    <Button type="submit" size="lg" className="btn-pulse-hover h-12 rounded-xl font-body text-base shrink-0"
                            disabled={isLoading || isAnalyzing || !selectedProjectId || !areApiConfigsLoaded || (getActiveUsableApis().length === 0 && allKeyedApiConfigs.length > 0) || (searchMode === 'custom' && customSelectedApis.size === 0)}>
                        {isLoading || isAnalyzing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Search className="mr-2 h-5 w-5" />}
                        {isLoading ? (isAnalyzing ? "Analyzing..." : "Seeking...") : "Search"}
                    </Button>
                </div>
            </div>
          </form>

          <div className="pt-2">
            <Label className="font-body text-muted-foreground mb-2 block text-xs">Search Mode</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-1">
                {SEARCH_MODES.map(mode => (
                    <Button
                        key={mode.id}
                        variant={searchMode === mode.id ? "default" : "outline"}
                        onClick={() => handleModeChange(mode.id)}
                        disabled={isLoading || isAnalyzing}
                        className={cn(
                            "flex-col h-auto p-3 rounded-xl text-xs sm:text-sm font-body",
                            searchMode === mode.id && "border-2 border-primary ring-2 ring-primary/50 btn-pulse-hover"
                        )}
                    >
                        <mode.icon className="h-5 w-5 sm:h-6 sm:w-6 mb-1" />
                        {mode.label}
                    </Button>
                ))}
            </div>
            {activeModeDetails && (
                <p className="text-xs text-muted-foreground text-center font-body min-h-[1.5em] pt-1">
                    {activeModeDetails.description}
                </p>
            )}
          </div>
        </CardContent>
      </Card>


        <div className="space-y-6">
            {currentApiError && !isLoading && !isAnalyzing && (
              <Card className="border-destructive/50 bg-destructive/10 rounded-2xl">
                <CardHeader>
                  <CardTitle className="font-headline text-xl text-destructive flex items-center"><AlertTriangle className="mr-2"/> Error Encountered</CardTitle>
                </CardHeader>
                <CardContent className="text-destructive font-body">
                  <p className="whitespace-pre-wrap break-words">{currentApiError}</p>
                </CardContent>
              </Card>
            )}

            {isLoading && !isAnalyzing && searchMode === 'standard' && (
                 <Card className="border-border/50 min-h-[150px] rounded-2xl bg-card/50 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-3 font-body text-muted-foreground">Delving into the archives (Standard)...</p>
                </Card>
            )}
            {searchMode === 'standard' && standardSearchResult && !isLoading && !isAnalyzing && (
                <Card className="border-border/50 rounded-2xl bg-card/50">
                    <CardHeader><CardTitle className="font-headline text-xl">Recovered Records (Standard)</CardTitle></CardHeader>
                    <CardContent className="font-body prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap p-4">{standardSearchResult}</CardContent>
                </Card>
            )}

            {searchMode === 'multi-source' && (isLoading || multiSourceResults.length > 0) && !isAnalyzing && (
              <Card className="border-border/50 rounded-2xl bg-card/50">
                <CardHeader><CardTitle className="font-headline text-xl">Multi-Source Echoes</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                  {(isLoading && multiSourceResults.filter(r => r.isLoading).length > 0 ? multiSourceResults : multiSourceResults.filter(r => r.resultText || r.error)).map((item, index) => (
                    <Card key={`${item.providerName}-${index}-multi`} className="rounded-xl bg-background/70 flex flex-col">
                      <CardHeader className="py-3 px-4 border-b">
                        <CardTitle className="font-headline text-base flex items-center justify-between">
                          {item.providerName}
                          {item.isLoading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 text-xs font-body flex-grow overflow-auto max-h-80">
                        {item.resultText && (isContentTypeJsonOrHtml(item.resultText) !== 'text' ? <pre className="whitespace-pre-wrap break-all">{item.resultText}</pre> : <p className="whitespace-pre-wrap break-words">{item.resultText}</p>)}
                        {item.error && <p className="text-destructive whitespace-pre-wrap break-words">{item.error}</p>}
                        {item.isLoading && <p className="text-muted-foreground">Fetching...</p>}
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            )}

            {(isLoading || isAnalyzing) && searchMode === 'summary' && (
                 <Card className="border-border/50 min-h-[150px] rounded-2xl bg-card/50 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-3 font-body text-muted-foreground">{isAnalyzing ? "Analyzing for Summary..." : "Gathering data for Summary..."}</p>
                </Card>
            )}
            {searchMode === 'summary' && summaryResult && !isLoading && !isAnalyzing && (
                <Card className="border-border/50 rounded-2xl bg-card/50">
                    <CardHeader>
                        <CardTitle className="font-headline text-xl">Summarized Echo (Style: {summaryStyle})</CardTitle>
                        <CardDescription className="font-body text-xs text-muted-foreground">Summary by: {getActiveUsableApis().find(api => api.rank === 0)?.name || 'Top Ranked API'}</CardDescription>
                    </CardHeader>
                    <CardContent className="font-body prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap p-4">{summaryResult}</CardContent>
                </Card>
            )}
            
            {searchMode === 'conflict' && (isLoading || isAnalyzing || conflictAnalysisResult || conflictRawResults.length > 0) && (
            <div className="space-y-6">
                <Card className="border-amber-500/50 bg-amber-500/10 rounded-2xl">
                <CardHeader>
                    <CardTitle className="font-headline text-xl text-amber-700 dark:text-amber-400 flex items-center">
                    <Zap className="mr-2"/> Conflict & Uniqueness Analysis
                    </CardTitle>
                    <CardDescription className="font-body text-amber-600 dark:text-amber-500">
                     {getActiveUsableApis().find(api => api.rank === 0) ? `Analysis performed by: ${getActiveUsableApis().find(api => api.rank === 0)?.name}.` : "A Rank #1 API is required for analysis."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="font-body prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap p-4">
                    {isLoading && !isAnalyzing && conflictAnalysisResult && <div className="flex items-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" />{conflictAnalysisResult}</div>}
                    {isLoading && isAnalyzing && conflictAnalysisResult && <div className="flex items-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" />{conflictAnalysisResult}</div>}
                    {!isLoading && conflictAnalysisResult && (isContentTypeJsonOrHtml(conflictAnalysisResult) !== 'text' ? <pre>{conflictAnalysisResult}</pre> : <p>{conflictAnalysisResult}</p>)}
                    {!isLoading && !conflictAnalysisResult && currentApiError && (
                        <p className="text-destructive">Could not perform analysis due to an error: {currentApiError}</p>
                    )}
                </CardContent>
                </Card>

                {conflictRawResults.length > 0 && (
                <Card className="border-border/50 rounded-2xl bg-card/50">
                    <CardHeader><CardTitle className="font-headline text-lg">Raw API Responses (Conflict Check)</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                    {conflictRawResults.map((item, index) => (
                        <Card key={`${item.providerName}-${index}-conflict`} className="rounded-xl bg-background/70 flex flex-col">
                        <CardHeader className="py-3 px-4 border-b">
                            <CardTitle className="font-headline text-base flex items-center justify-between">
                            {item.providerName}
                            {item.isLoading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 text-xs font-body flex-grow overflow-auto max-h-80">
                            {item.resultText && (isContentTypeJsonOrHtml(item.resultText) !== 'text' ? <pre className="whitespace-pre-wrap break-all">{item.resultText}</pre> : <p className="whitespace-pre-wrap break-words">{item.resultText}</p>)}
                            {item.error && <p className="text-destructive whitespace-pre-wrap break-words">{item.error}</p>}
                            {item.isLoading && <p className="text-muted-foreground">Fetching...</p>}
                        </CardContent>
                        </Card>
                    ))}
                    </CardContent>
                </Card>
                )}
            </div>
            )}


            {(isLoading || isAnalyzing) && searchMode === 'custom' && (customSelectedApis.size === 1 || customDisplayFormat === 'side-by-side' ? multiSourceResults.some(r=>r.isLoading) : true) && (
                 <Card className="border-border/50 min-h-[150px] rounded-2xl bg-card/50 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-3 font-body text-muted-foreground">{isAnalyzing ? "Analyzing for Custom Summary..." : "Processing Custom Selection..."}</p>
                </Card>
            )}
            {searchMode === 'custom' && 
              (customSelectedApis.size === 1 || customDisplayFormat === 'side-by-side') && 
              multiSourceResults.length > 0 && 
              !multiSourceResults.some(r=>r.isLoading) && 
              !isAnalyzing && (
                 <Card className="border-border/50 rounded-2xl bg-card/50">
                    <CardHeader><CardTitle className="font-headline text-xl">
                        {customSelectedApis.size === 1 ? "Custom Selection Result" : "Custom Selection Results (Side-by-Side)"}
                    </CardTitle></CardHeader>
                    <CardContent className={`grid grid-cols-1 ${multiSourceResults.length > 1 ? "md:grid-cols-2 lg:grid-cols-3" : ""} gap-4 p-4`}>
                    {multiSourceResults.map((item, index) => (
                        <Card key={`${item.providerName}-${index}-custom`} className="rounded-xl bg-background/70 flex flex-col">
                        <CardHeader className="py-3 px-4 border-b"><CardTitle className="font-headline text-base">{item.providerName}</CardTitle></CardHeader>
                        <CardContent className="p-3 text-xs font-body flex-grow overflow-auto max-h-80">
                            {item.resultText && (isContentTypeJsonOrHtml(item.resultText) !== 'text' ? <pre className="whitespace-pre-wrap break-all">{item.resultText}</pre> : <p className="whitespace-pre-wrap break-words">{item.resultText}</p>)}
                            {item.error && <p className="text-destructive whitespace-pre-wrap break-words">{item.error}</p>}
                        </CardContent>
                        </Card>
                    ))}
                    </CardContent>
                </Card>
            )}
             {searchMode === 'custom' && customSelectedApis.size > 1 && customDisplayFormat === 'summarized' && customApiResult && !isLoading && !isAnalyzing && (
                <Card className="border-border/50 rounded-2xl bg-card/50">
                     <CardHeader>
                        <CardTitle className="font-headline text-xl">Custom Selection (Summarized)</CardTitle>
                        <CardDescription className="font-body text-xs text-muted-foreground">Summary by: {getActiveUsableApis().find(api => api.rank === 0)?.name || 'Top Ranked API'}</CardDescription>
                    </CardHeader>
                    <CardContent className="font-body prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap p-4">{customApiResult}</CardContent>
                </Card>
            )}


            {!isLoading && !isAnalyzing && !currentApiError &&
              !standardSearchResult &&
              multiSourceResults.length === 0 &&
              !summaryResult &&
              !conflictAnalysisResult && conflictRawResults.length === 0 &&
              !customApiResult && (
              <Card className="border-border/50 min-h-[150px] rounded-2xl bg-card/50 flex items-center justify-center">
                <p className="text-muted-foreground font-body text-center">
                  The scrolls are blank. Your query's answer awaits discovery.
                </p>
              </Card>
            )}
        </div>

        <Dialog open={isCustomApiDialogOpen} onOpenChange={setIsCustomApiDialogOpen}>
            <DialogContent className="sm:max-w-md rounded-2xl font-body">
                <DialogHeader>
                    <DialogTitle className="font-headline">Custom API Selection</DialogTitle>
                    <DialogDescription>
                        Choose APIs and display format. Click Search on the main page after configuring.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                    <div>
                        <Label className="font-semibold">Select API Configurations to Query:</Label>
                        <div className="mt-2 space-y-2">
                            {allKeyedApiConfigs.length > 0 ? allKeyedApiConfigs.sort((a,b) => (a.rank ?? Infinity) - (b.rank ?? Infinity)).map(api => {
                                const quotaReached = (api.dailyQuota !== undefined && api.dailyQuota !== null && (api.usageToday ?? 0) >= api.dailyQuota);
                                return (
                                <div key={api.configId} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/50">
                                    <Checkbox
                                        id={`custom-api-${api.configId}`}
                                        checked={customSelectedApis.has(api.configId)}
                                        onCheckedChange={(checked) => handleCustomApiSelection(api.configId, !!checked)}
                                        disabled={quotaReached}
                                    />
                                    <Label htmlFor={`custom-api-${api.configId}`} className={cn("font-normal cursor-pointer flex-grow", quotaReached && "text-muted-foreground line-through")}>
                                        {api.name} (Rank {api.rank !== undefined ? api.rank + 1 : 'N/A'})
                                         {quotaReached &&
                                          <AlertTriangle className="inline-block ml-2 h-4 w-4 text-destructive" />}
                                    </Label>
                                </div>
                            )}) : <p className="text-sm text-muted-foreground">No API configurations with keys found. Configure them in Profile.</p>}
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="custom-display-format" className="font-semibold">Display Format:</Label>
                        <Select 
                            value={customSelectedApis.size <= 1 ? 'side-by-side' : customDisplayFormat} 
                            onValueChange={(val) => setCustomDisplayFormat(val as 'side-by-side' | 'summarized')}
                            disabled={customSelectedApis.size <= 1}
                        >
                            <SelectTrigger id="custom-display-format" className="mt-2 rounded-xl">
                                <SelectValue placeholder={customSelectedApis.size <= 1 ? "Standard Display (Single API)" : "Select display format..."} />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="side-by-side">Side-by-Side</SelectItem>
                                <SelectItem value="summarized">Summarized (by Rank #1 API)</SelectItem>
                            </SelectContent>
                        </Select>
                         {customSelectedApis.size <= 1 && (
                            <p className="text-xs text-muted-foreground mt-1">
                                Standard display used for single API selection.
                            </p>
                        )}
                         {customSelectedApis.size > 1 && customDisplayFormat === 'summarized' && !getActiveUsableApis().find(api => api.rank === 0) && (
                            <p className="text-xs text-destructive mt-1 flex items-center">
                                <AlertCircle className="mr-1 h-3 w-3" /> No Rank #1 API available for summarization.
                            </p>
                         )}
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" className="rounded-xl">Close</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <AlertDialog open={projectToDeleteId !== null} onOpenChange={(open) => !open && setProjectToDeleteId(null)}>
            <AlertDialogContent className="rounded-2xl font-body">
                <AlertDialogHeader>
                <AlertDialogTitle className="font-headline">Confirm Project Deletion</AlertDialogTitle>
                <AlertDialogDescription>
                    Are you sure you want to delete the project "{projects.find(p=>p.id === projectToDeleteId)?.name || 'Selected Project'}"? 
                    This action cannot be undone. Associated history items will remain but the project will be gone.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={handleDeleteProjectCancel} className="rounded-xl">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteProjectConfirm} className="bg-destructive hover:bg-destructive/90 rounded-xl">Delete Project</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

    </div>
  );
}
    

    
