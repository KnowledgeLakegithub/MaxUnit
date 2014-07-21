$path = $args[0].ToString()
Set-Location $path

#check node package manager version
$nodeVersion = npm -v
if ([string]::IsNullOrEmpty($nodeVersion))
{
	Write-Error "No version of npm installed! Please install NodeJs http://nodejs.org/download/   Exiting with code 1"
}
else
{
	write-host  "Node Package Manager version: " $nodeVersion
}

#check for dalekjs
$dalekVersion = npm list "-parseable true -depth 1" | Out-String  #dalek "--version"
$result = $dalekVersion.toLower().contains("dalekjs")

write-Host "Searching for DalekJS.  Valid Installation found: " $result
if ($result -ne "True")
{
	write-host "No version of DalekJS installed.  Downloading via npm"
	npm install dalekjs "--save-dev"
}

#execute tests
$myCommand = dalek dalek_tests.js -l 4 --nocolors | Write-Output

$Lines = $myCommand | Select-String "assertions passed"
$a, $b, $c

ForEach($Line in $Lines){
	$Line
	$a = ($Lines -split(" "))[1]
	$b = ($a -split("/"))[0]
	$c = ($a -split("/"))[1]
}

#if not all assertions passed - throw error code 1
if ($b -ne $c)
{
	Write-Error "Not all assertions passed!  exiting with code 1"
	exit 1
}