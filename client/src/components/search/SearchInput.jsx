import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "../ui/input";
import SearchDropdown from "./SearchDropdown";
import { searchAllApi } from "../../services/searchService";

function SearchInput() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState({ users: [], posts: [] });
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const cacheRef = useRef(new Map());

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const normalizedKeyword = keyword.trim();

    if (!normalizedKeyword) {
      setLoading(false);
      setResults({ users: [], posts: [] });
      return undefined;
    }

    if (cacheRef.current.has(normalizedKeyword)) {
      setResults(cacheRef.current.get(normalizedKeyword));
      return undefined;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const response = await searchAllApi(normalizedKeyword);
        const nextResults = response.data || { users: [], posts: [] };
        cacheRef.current.set(normalizedKeyword, nextResults);
        setResults(nextResults);
      } catch (error) {
        console.error(error);
        setResults({ users: [], posts: [] });
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [keyword]);

  const handleSelectUser = (user) => {
    setOpen(false);
    navigate(`/users/${user._id}`);
  };

  const handleSelectPost = (post) => {
    setOpen(false);
    navigate(`/?postId=${post._id}`);
  };

  return (
    <div ref={wrapperRef} className="relative hidden w-[320px] md:block lg:w-[360px]">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-muted"
        size={16}
      />
      <Input
        type="text"
        value={keyword}
        placeholder="Tìm kiếm trên Connecta"
        className="h-10 rounded-full border-orange-100 bg-orange-50/70 pl-9 shadow-none"
        onChange={(event) => {
          setKeyword(event.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (keyword.trim() || results.users.length || results.posts.length) {
            setOpen(true);
          }
        }}
      />

      <SearchDropdown
        open={open && !!keyword.trim()}
        loading={loading}
        keyword={keyword}
        results={results}
        onSelectUser={handleSelectUser}
        onSelectPost={handleSelectPost}
      />
    </div>
  );
}

export default SearchInput;
