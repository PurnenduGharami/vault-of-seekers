
"use client";

import type { NextPage } from 'next';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react'; // Added useRef
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from '@/components/ui/textarea';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Star,
  Trash2,
  Clock,
  ScrollText,
  Edit3,
  Save,
  FileText,
  FileJson,
  FileCode,
  ChevronDown,
  Filter,
  Briefcase,
  MessageSquareText,
  Loader2
} from "lucide-react";
import { format, isToday, isYesterday } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const DEFAULT_PROJECT_NAME_FALLBACK = 'Seeker’s Curiosity (Default)';


export interface HistoryItem {
  id: string;
  query: string;
  date: string;
  timestamp: number;
  type: string;
  notes?: string;
  isFavorite?: boolean;
  projectId: string;
  projectName: string;
  resultText?: string;
}

interface GroupedHistory {
  [projectName: string]: {
    [dateGroup: string]: HistoryItem[];
  };
}

const HistoryPage: NextPage = () => {
  const { toast } = useToast();
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isHistoryInitialized, setIsHistoryInitialized] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const [currentEditingNoteId, setCurrentEditingNoteId] = useState<string | null>(null);

  const [groupedHistory, setGroupedHistory] = useState<GroupedHistory>({});
  const [activeProjectAccordions, setActiveProjectAccordions] = useState<string[]>([]);
  const [activeDateAccordions, setActiveDateAccordions] = useState<Record<string, string[]>>({});

  const initialAutoOpenDone = useRef(false);


  // Load history from localStorage on initial mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let loadedHistory: HistoryItem[] = [];
    const storedHistory = localStorage.getItem('vaultOfSeekersHistory');
    if (storedHistory) {
        try {
            const parsedHistory = JSON.parse(storedHistory) as any[];
            loadedHistory = parsedHistory.map((item: any) => ({
                id: item.id || `item_${Math.random().toString(36).substr(2, 9)}`,
                query: item.query || "Unknown Query",
                date: item.date || format(item.timestamp || Date.now(), "MMM d, yyyy, p"),
                timestamp: item.timestamp || Date.now(),
                type: item.type || "Unknown Type",
                projectId: item.projectId || 'default_project_1',
                projectName: item.projectName || DEFAULT_PROJECT_NAME_FALLBACK,
                resultText: item.resultText || undefined,
                isFavorite: item.isFavorite || false,
                notes: item.notes || "",
            })).sort((a, b) => b.timestamp - a.timestamp);
        } catch (error) {
            console.error("Error parsing history from localStorage, initializing to empty.", error);
            loadedHistory = [];
            localStorage.setItem('vaultOfSeekersHistory', JSON.stringify(loadedHistory));
        }
    } else {
      localStorage.setItem('vaultOfSeekersHistory', JSON.stringify(loadedHistory));
    }
    setHistoryItems(loadedHistory);
    setIsHistoryInitialized(true);
  }, []);

  // Save history to localStorage whenever historyItems changes
  useEffect(() => {
    if (typeof window === 'undefined' || !isHistoryInitialized) return;
    localStorage.setItem('vaultOfSeekersHistory', JSON.stringify(historyItems));
  }, [historyItems, isHistoryInitialized]);


  useEffect(() => {
    if (!isHistoryInitialized) return;

    let items = [...historyItems];
    if (showFavoritesOnly) {
      items = items.filter(item => item.isFavorite);
    }
    if (searchTerm) {
      items = items.filter(item =>
        item.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.projectName && item.projectName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.resultText && item.resultText.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    const newGroupedHistory: GroupedHistory = {};
    items.forEach(item => {
      if (!item.projectName) return;

      if (!newGroupedHistory[item.projectName]) {
        newGroupedHistory[item.projectName] = {};
      }

      let dateGroup: string;
      const itemDate = new Date(item.timestamp);
      if (isToday(itemDate)) {
        dateGroup = "Today";
      } else if (isYesterday(itemDate)) {
        dateGroup = "Yesterday";
      } else {
        dateGroup = format(itemDate, "MMMM d, yyyy");
      }

      if (!newGroupedHistory[item.projectName][dateGroup]) {
        newGroupedHistory[item.projectName][dateGroup] = [];
      }
      newGroupedHistory[item.projectName][dateGroup].push(item);
    });

    setGroupedHistory(newGroupedHistory);

    if (!initialAutoOpenDone.current && !searchTerm && !showFavoritesOnly && Object.keys(newGroupedHistory).length > 0) {
      const projectKeysToOpen = Object.keys(newGroupedHistory);
      setActiveProjectAccordions(projectKeysToOpen);

      const dateAccordionsToOpen: Record<string, string[]> = {};
      projectKeysToOpen.forEach(projKey => {
        if (newGroupedHistory[projKey]) {
             dateAccordionsToOpen[projKey] = Object.keys(newGroupedHistory[projKey]);
        }
      });
      setActiveDateAccordions(dateAccordionsToOpen);

      initialAutoOpenDone.current = true;
    }

  }, [historyItems, searchTerm, showFavoritesOnly, isHistoryInitialized]);


  const toggleFavorite = (id: string) => {
    setHistoryItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
      )
    );
  };

  const handleDelete = (id: string) => {
    setHistoryItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const handleClearAllHistory = () => {
    setHistoryItems([]);
    setActiveProjectAccordions([]);
    setActiveDateAccordions({});
    initialAutoOpenDone.current = false;
  };

  const handleNoteChange = (id: string, value: string) => {
    setEditingNotes(prev => ({ ...prev, [id]: value }));
  };

  const handleSaveNote = (id: string) => {
    setHistoryItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, notes: editingNotes[id] ?? item.notes } : item
      )
    );
    setCurrentEditingNoteId(null);
  };

  const startEditingNote = (item: HistoryItem) => {
    setCurrentEditingNoteId(item.id);
    setEditingNotes(prev => ({ ...prev, [item.id]: item.notes ?? '' }));
  };

  const handleProjectAccordionChange = (values: string[]) => {
    setActiveProjectAccordions(values);
  };

  const handleDateAccordionChange = (projectName: string, values: string[]) => {
    setActiveDateAccordions(prev => ({
      ...prev,
      [projectName]: values,
    }));
  };

  const projectKeys = Object.keys(groupedHistory).sort((a,b) => {
    const getLatestTimestamp = (projectItems: {[dateGroup: string]: HistoryItem[]}): number => {
        if (!projectItems || Object.keys(projectItems).length === 0) return 0;
        return Math.max(...Object.values(projectItems).flat().map(item => item.timestamp));
    }
    const latestA = getLatestTimestamp(groupedHistory[a]);
    const latestB = getLatestTimestamp(groupedHistory[b]);
    return latestB - latestA;
  });


  const downloadFile = (filename: string, content: string, mimeType: string) => {
    const element = document.createElement("a");
    const file = new Blob([content], { type: mimeType });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(element.href);
    toast({ title: "Export Successful", description: `${filename} has been downloaded.`});
  };

  const handleExport = (item: HistoryItem, formatType: 'json' | 'md') => {
    const safeQuery = item.query.substring(0, 30).replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filenameBase = `${safeQuery}_${item.timestamp}`;

    if (formatType === 'json') {
      const dataToExport = {
        id: item.id,
        query: item.query,
        date: item.date,
        timestamp: item.timestamp,
        type: item.type,
        notes: item.notes,
        isFavorite: item.isFavorite,
        projectId: item.projectId,
        projectName: item.projectName,
        resultText: item.resultText,
      };
      const jsonString = JSON.stringify(dataToExport, null, 2);
      downloadFile(`${filenameBase}.json`, jsonString, 'application/json');
    } else if (formatType === 'md') {
      const markdownString = `
# Query: ${item.query}

**Project:** ${item.projectName}
**Type:** ${item.type}
**Date:** ${item.date}
**Favorite:** ${item.isFavorite ? 'Yes' : 'No'}

## Result:
\`\`\`
${item.resultText || 'No result text available.'}
\`\`\`

## Notes:
${item.notes || 'No notes added.'}
`;
      downloadFile(`${filenameBase}.md`, markdownString.trim(), 'text/markdown');
    }
  };


  if (!isHistoryInitialized) {
    return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2 font-body">Loading history...</p>
        </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-headline text-4xl font-semibold text-foreground">Vault Record</h1>
          <p className="text-muted-foreground mt-1 font-body">A record of your recent activity in the Vault. Track your journey, revisit past insights, and continue exploring with clarity.</p>
        </div>
        {historyItems.length > 0 && (
            <Button variant="destructive" onClick={handleClearAllHistory} className="rounded-2xl btn-pulse-hover font-body">
                <Trash2 className="mr-2 h-5 w-5" /> Clear All History
            </Button>
        )}
      </div>

      <Card className="p-4 sm:p-6 rounded-2xl border-border/50 bg-card/70">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-grow w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Filter by query, project, notes, or results..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl font-body border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/50 bg-background/80"
              aria-label="Filter history"
            />
          </div>
          <div className="flex items-center space-x-2 pt-2 md:pt-0">
            <Switch
              id="favorites-toggle"
              checked={showFavoritesOnly}
              onCheckedChange={setShowFavoritesOnly}
              aria-label="Show favorites only"
            />
            <Label htmlFor="favorites-toggle" className="font-body text-sm">Show Favorites Only</Label>
          </div>
        </div>
      </Card>

      {projectKeys.length > 0 ? (
        <Accordion type="multiple" value={activeProjectAccordions} onValueChange={handleProjectAccordionChange} className="w-full space-y-4">
          {projectKeys.map((projectName) => (
            <AccordionItem key={projectName} value={projectName} className="border border-border/50 rounded-2xl bg-card/80 overflow-hidden">
              <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/10 text-xl font-headline">
                <div className="flex items-center">
                  <Briefcase className="mr-3 h-6 w-6 text-primary" /> {projectName}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-2 sm:px-4 pb-4 space-y-3">
                {Object.keys(groupedHistory[projectName] || {}).length > 0 ? (
                  <Accordion
                    type="multiple"
                    value={activeDateAccordions[projectName] || []}
                    onValueChange={(values) => handleDateAccordionChange(projectName, values)}
                    className="w-full space-y-2"
                  >
                    {Object.keys(groupedHistory[projectName]).sort((a, b) => {
                      const getDateValue = (dateGroupKey: string) => {
                        if (dateGroupKey === "Today") return new Date().setHours(23,59,59,999);
                        if (dateGroupKey === "Yesterday") return new Date(new Date().setDate(new Date().getDate() -1)).setHours(23,59,59,999);
                        const itemsInGroup = groupedHistory[projectName][dateGroupKey];
                        return itemsInGroup && itemsInGroup.length > 0 ? new Date(itemsInGroup[0].timestamp).getTime() : 0;
                      };
                      return getDateValue(b) - getDateValue(a);
                    }).map((dateGroup) => (
                      <AccordionItem key={dateGroup} value={dateGroup} className="border-none rounded-xl bg-card/50 data-[state=open]:bg-card/60">
                        <AccordionTrigger className="px-4 py-3 hover:no-underline text-base font-semibold text-muted-foreground hover:text-foreground">
                          {dateGroup}
                        </AccordionTrigger>
                        <AccordionContent className="px-2 sm:px-4 pb-2 space-y-4">
                          {groupedHistory[projectName][dateGroup].map((item) => (
                            <Card key={item.id} className="hover:shadow-primary/10 transition-shadow duration-300 ease-in-out border-border hover:border-primary/50 rounded-xl overflow-hidden bg-background/70">
                              <CardContent className="p-4 md:p-6 flex flex-col gap-4">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                    <div className="flex-grow space-y-1">
                                        <div className="flex items-center text-xs sm:text-sm text-muted-foreground mb-1 font-body">
                                        {item.type.toLowerCase().includes("search") ? <Search className="h-4 w-4 mr-2 text-accent" /> : <ScrollText className="h-4 w-4 mr-2 text-accent" />}
                                        <span>{item.type}</span>
                                        <span className="mx-1.5 sm:mx-2">·</span>
                                        <Clock className="h-4 w-4 mr-1" />
                                        <span>{item.date}</span>
                                        </div>
                                        <Link
                                            href={`/home?search=${encodeURIComponent(item.query)}&project=${item.projectId}`}
                                            className="font-headline text-lg sm:text-xl text-foreground hover:text-primary transition-colors duration-200 block"
                                        >
                                        {item.query}
                                        </Link>
                                    </div>
                                    <div className="flex space-x-1 shrink-0 mt-2 sm:mt-0">
                                        <Button variant="ghost" size="icon" onClick={() => toggleFavorite(item.id)} className="rounded-xl text-muted-foreground hover:text-accent">
                                        <Star className={`h-5 w-5 ${item.isFavorite ? 'fill-accent text-accent' : ''}`} />
                                        <span className="sr-only">Toggle Favorite</span>
                                        </Button>
                                        <Button variant="outline" size="sm" asChild className="rounded-xl font-body">
                                          <Link href={`/home?search=${encodeURIComponent(item.query)}&project=${item.projectId}`}>
                                            <Search className="mr-1.5 h-4 w-4" /> Re-Search
                                          </Link>
                                        </Button>
                                        <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="sm" className="rounded-xl font-body">
                                            <FileText className="mr-1.5 h-4 w-4" /> Export <ChevronDown className="ml-1 h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-xl font-body">
                                            <DropdownMenuItem onClick={() => handleExport(item, 'json')}><FileJson className="mr-2 h-4 w-4" /> JSON</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleExport(item, 'md')}><FileCode className="mr-2 h-4 w-4" /> Markdown</DropdownMenuItem>
                                        </DropdownMenuContent>
                                        </DropdownMenu>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="rounded-xl text-muted-foreground hover:text-destructive">
                                        <Trash2 className="h-5 w-5" />
                                        <span className="sr-only">Delete item</span>
                                        </Button>
                                    </div>
                                </div>

                                {item.resultText && (
                                  <div className="space-y-2 pt-3 mt-3 border-t border-border/30">
                                    <Label className="font-body text-sm text-muted-foreground flex items-center">
                                      <MessageSquareText className="mr-2 h-4 w-4 text-primary"/> Recovered Records (Result)
                                    </Label>
                                    <div className="p-2 rounded-xl bg-background/50 font-body text-sm max-h-40 overflow-y-auto prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                                      {item.resultText}
                                    </div>
                                  </div>
                                )}

                                <div className="space-y-2 pt-3 mt-3 border-t border-border/30">
                                  <Label htmlFor={`notes-${item.id}`} className="font-body text-sm text-muted-foreground flex items-center">
                                    <Edit3 className="mr-2 h-4 w-4" /> Seeker's Notes
                                  </Label>
                                  {currentEditingNoteId === item.id ? (
                                    <div className="space-y-2">
                                       <Textarea
                                        id={`notes-${item.id}`}
                                        value={editingNotes[item.id] ?? ''}
                                        onChange={(e) => handleNoteChange(item.id, e.target.value)}
                                        placeholder="Add your arcane insights here..."
                                        className="w-full font-body rounded-xl min-h-[80px] bg-background/70"
                                        rows={3}
                                      />
                                      <div className="flex justify-end space-x-2">
                                        <Button variant="ghost" size="sm" onClick={() => setCurrentEditingNoteId(null)} className="rounded-xl font-body">Cancel</Button>
                                        <Button size="sm" onClick={() => handleSaveNote(item.id)} className="rounded-xl font-body btn-pulse-hover"><Save className="mr-2 h-4 w-4"/>Save Note</Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div
                                      onClick={() => startEditingNote(item)}
                                      className="p-2 rounded-xl hover:bg-muted/30 cursor-text min-h-[40px] font-body text-sm"
                                    >
                                      {item.notes || <span className="text-muted-foreground italic">No notes yet. Click to add.</span>}
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <p className="text-muted-foreground text-center py-4 font-body">No history entries for this project with current filters.</p>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <Card className="text-center py-12 border-dashed border-border/50 rounded-2xl bg-card/70">
          <CardHeader>
            <Filter className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <CardTitle className="font-headline text-2xl">No Record Found</CardTitle>
          </CardHeader>
          <CardContent>
             <p className="max-w-md mx-auto font-body text-muted-foreground">
              {searchTerm || showFavoritesOnly
                ? "Your current filters yield no results. Try adjusting your criteria."
                : "This is where Seekrs keep track of their acquired knowledge — a compass in the ever-expanding Vault, ensuring no insight is lost to the infinite paths they've explored."
              }
            </p>
          </CardContent>
          {!searchTerm && !showFavoritesOnly && historyItems.length === 0 && (
            <CardFooter className="justify-center">
                <Button asChild className="mt-6 btn-pulse-hover rounded-2xl font-body">
                    <Link href="/home">Start Seeking</Link>
                </Button>
            </CardFooter>
          )}
        </Card>
      )}
    </div>
  );
};

export default HistoryPage;

    
