"use client";

interface TabSwitcherProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = ["Edit", "Preview", "Send"];

const TabSwitcher = ({ activeTab, onTabChange }: TabSwitcherProps) => (
  <div className="inline-flex rounded-lg bg-muted p-1">
    {tabs.map((tab) => (
      <button
        key={tab}
        onClick={() => onTabChange(tab)}
        className={`rounded-md px-4 py-1.5 font-heading text-sm font-medium transition-all ${
          activeTab === tab
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {tab}
      </button>
    ))}
  </div>
);

export default TabSwitcher;