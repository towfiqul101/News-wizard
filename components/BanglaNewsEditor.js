const checkSpelling = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setLoadingType("spell");
    
    try {
      const response = await fetch("/api/check-spelling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      
      const data = await response.json();
      console.log("Spell Check API Response:", data); // 🔥 Debugging log
      
      if (!response.ok) {
        throw new Error(data.error || `Server returned ${response.status}`);
      }
      
      const errorsList = data.errors || (data.result && data.result.errors) || [];
      setErrors(errorsList);
      
      if (errorsList.length === 0) {
        alert(data.summary || "কোনো বানান ভুল পাওয়া যায়নি।");
      } else {
        setActiveTab("ভুল");
      }
      
    } catch (error) {
      console.error("Spell check failed:", error);
      alert(`সার্ভার এরর: ${error.message}. Console চেক করুন।`);
    } finally {
      setLoading(false);
      setLoadingType("");
    }
  };

  const rewriteNews = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setLoadingType("rewrite");
    
    try {
      const response = await fetch("/api/rewrite-news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      
      const data = await response.json();
      console.log("Rewrite API Response:", data); // 🔥 Debugging log
      
      if (!response.ok) {
         throw new Error(data.error || `Server returned ${response.status}`);
      }
      
      const newRewritten = data.rewritten || (data.result && data.result.rewritten) || "";
      const newEnglish = data.english || (data.result && data.result.english) || "";
      const newChanges = data.changes || (data.result && data.result.changes) || [];
      
      setRewritten(newRewritten);
      setEnglish(newEnglish);
      setChanges(newChanges);
      
      if (newRewritten) {
        setActiveTab("সম্পাদিত");
      } else {
        alert("সম্পাদনা করা সম্ভব হয়নি।");
      }
      
    } catch (error) {
      console.error("Rewrite failed:", error);
      alert(`সার্ভার এরর: ${error.message}. Console চেক করুন।`);
    } finally {
      setLoading(false);
      setLoadingType("");
    }
  };
