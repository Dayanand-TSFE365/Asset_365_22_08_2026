import PeopleList from "../components/PeopleList";

export default function LoginEnabled() {
  return (
    <PeopleList
      title="Login Enabled"
      filter="enabled"
    />
  );
}